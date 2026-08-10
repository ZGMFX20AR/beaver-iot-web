import { useMemo } from 'react';
import { useRequest } from 'ahooks';
import { isNil } from 'lodash-es';
import type { LatLngTuple } from 'leaflet';

import {
    awaitWrap,
    isRequestSuccess,
    getResponseData,
    entityAPI,
    type DeviceDetail,
} from '@/services/http';

/** Entity identifiers holding the platform-managed device position */
const LATITUDE_ENTITY_SUFFIX = '.@location.@latitude';
const LONGITUDE_ENTITY_SUFFIX = '.@location.@longitude';

/** Upper bound on history points fetched per coordinate, per device */
const MAX_TRAIL_POINTS = 500;

/** Interpolated points inserted between each pair of fixes when smoothing */
const SMOOTHING_STEPS = 6;

/** Ceiling on rendered points per device, so a long history stays cheap to draw */
const MAX_RENDERED_POINTS = 2000;

/**
 * Round a straight polyline into a curve through its points.
 *
 * Positions arrive as discrete fixes, so joining them directly gives hard corners at every
 * uplink. A centripetal Catmull-Rom spline passes exactly through each reported position
 * while curving between them, which reads as travel rather than as a series of jumps.
 * Only the drawn line is affected - the underlying fixes are untouched.
 */
const smoothPath = (points: LatLngTuple[]): LatLngTuple[] => {
    // Two points are already a straight line; nothing to curve.
    if (points.length < 3) return points;

    const steps = Math.max(
        1,
        Math.min(SMOOTHING_STEPS, Math.floor(MAX_RENDERED_POINTS / points.length)),
    );
    const result: LatLngTuple[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        // Duplicate the endpoints so the curve starts and ends on real positions.
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

        for (let step = 0; step < steps; step++) {
            const t = step / steps;
            const t2 = t * t;
            const t3 = t2 * t;

            // Catmull-Rom basis, evaluated independently for latitude and longitude.
            const interpolate = (a: number, b: number, c: number, d: number) =>
                0.5 *
                (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);

            result.push([
                interpolate(p0[0], p1[0], p2[0], p3[0]),
                interpolate(p0[1], p1[1], p2[1], p3[1]),
            ]);
        }
    }

    // The loop above stops short of the final fix; keep it so the trail ends where the device is.
    result.push(points[points.length - 1]);
    return result;
};

export interface UseDeviceTrailProps {
    devices?: DeviceDetail[];
    /** How far back the trail reaches, in milliseconds */
    trailTime?: number;
    enabled?: boolean;
}

/**
 * Build each device's recent movement path from its location history.
 *
 * Latitude and longitude are stored as two separate entities, so their histories are
 * fetched independently and paired on timestamp. A device only contributes a path once
 * it has at least two positions to join.
 */
export const useDeviceTrail = ({ devices, trailTime, enabled }: UseDeviceTrailProps) => {
    /** Device keys are stable, so derive a cheap dependency from them */
    const deviceKeys = useMemo(
        () => (devices || []).map(device => device.key).filter(Boolean),
        [devices],
    );

    const { data: trails } = useRequest(
        async () => {
            if (!enabled || !deviceKeys.length || !trailTime) {
                return {} as Record<string, LatLngTuple[]>;
            }

            const endTimestamp = Date.now();
            const startTimestamp = endTimestamp - trailTime;

            /** Resolve the location entities for every device in one call */
            const entityKeys = deviceKeys.flatMap(key => [
                `${key}${LATITUDE_ENTITY_SUFFIX}`,
                `${key}${LONGITUDE_ENTITY_SUFFIX}`,
            ]);

            const [entityError, entityResp] = await awaitWrap(
                entityAPI.getList({ entity_keys: entityKeys, page_size: entityKeys.length }),
            );
            const entityData = getResponseData(entityResp);
            if (entityError || !entityData || !isRequestSuccess(entityResp)) {
                return {} as Record<string, LatLngTuple[]>;
            }

            /** entity key -> entity id */
            const entityIdByKey = new Map<string, ApiKey>();
            (entityData.content || []).forEach((entity: any) => {
                const key = entity.entity_key || entity.entityKey;
                const id = entity.entity_id || entity.entityId;
                if (key && !isNil(id)) entityIdByKey.set(key, id);
            });

            const fetchHistory = async (entityId?: ApiKey) => {
                if (isNil(entityId)) return [];
                const [error, resp] = await awaitWrap(
                    entityAPI.getHistory({
                        entity_id: entityId,
                        start_timestamp: startTimestamp,
                        end_timestamp: endTimestamp,
                        page_size: MAX_TRAIL_POINTS,
                        page_number: 1,
                    }),
                );
                const data = getResponseData(resp);
                if (error || !data || !isRequestSuccess(resp)) return [];
                return data.content || [];
            };

            const result: Record<string, LatLngTuple[]> = {};

            await Promise.all(
                deviceKeys.map(async deviceKey => {
                    const [latHistory, lngHistory] = await Promise.all([
                        fetchHistory(entityIdByKey.get(`${deviceKey}${LATITUDE_ENTITY_SUFFIX}`)),
                        fetchHistory(entityIdByKey.get(`${deviceKey}${LONGITUDE_ENTITY_SUFFIX}`)),
                    ]);

                    if (!latHistory.length || !lngHistory.length) return;

                    /**
                     * Both coordinates are written by the same uplink, so they share a
                     * timestamp; pairing on it keeps a point only when both halves exist.
                     */
                    const longitudeByTime = new Map<number, number>();
                    lngHistory.forEach((row: any) => {
                        const value = Number(row.value);
                        if (!Number.isNaN(value)) longitudeByTime.set(Number(row.timestamp), value);
                    });

                    const points = latHistory
                        .map((row: any) => {
                            const timestamp = Number(row.timestamp);
                            const latitude = Number(row.value);
                            const longitude = longitudeByTime.get(timestamp);
                            if (Number.isNaN(latitude) || isNil(longitude)) return null;
                            return { timestamp, latLng: [latitude, longitude] as LatLngTuple };
                        })
                        .filter(Boolean) as { timestamp: number; latLng: LatLngTuple }[];

                    // Oldest first so the line reads as travel direction.
                    points.sort((a, b) => a.timestamp - b.timestamp);

                    if (points.length > 1) {
                        result[deviceKey] = smoothPath(points.map(point => point.latLng));
                    }
                }),
            );

            return result;
        },
        {
            debounceWait: 300,
            refreshDeps: [deviceKeys, trailTime, enabled],
        },
    );

    return { trails: trails || {} };
};

export default useDeviceTrail;
