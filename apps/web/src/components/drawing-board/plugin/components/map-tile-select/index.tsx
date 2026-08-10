import { useMemo } from 'react';
import { useI18n } from '@milesight/shared/src/hooks';

import { mapConfigs, type MapType, type MapServiceType } from '@/services/map';
import Select, { type SelectProps } from '../select';

/**
 * Display names of the map providers. These are proper nouns, so they are not translated.
 */
const PROVIDER_LABELS: Record<MapType, string> = {
    openStreet: 'OpenStreetMap',
    google: 'Google',
    gaoDe: 'AMap (GaoDe)',
    baidu: 'Baidu',
    tencent: 'Tencent',
};

/**
 * Order the service types so the list reads consistently across providers.
 */
const SERVICE_ORDER: MapServiceType[] = ['normal', 'satellite', 'terrain'];

/**
 * Map base layer selection component.
 *
 * Options are derived from the map service config rather than hard-coded, so a provider
 * or service type added there shows up here automatically, and combinations a provider
 * does not actually serve (e.g. OpenStreetMap satellite) are never offered.
 */
const MapTileSelect = (selectProps: PartialOptional<SelectProps, 'options'>) => {
    const { getIntlText } = useI18n();

    const serviceLabels = useMemo<Record<MapServiceType, string>>(() => {
        return {
            normal: getIntlText('common.label.normal'),
            satellite: getIntlText('dashboard.label_map_layer_satellite'),
            terrain: getIntlText('dashboard.label_map_layer_terrain'),
        };
    }, [getIntlText]);

    const defaultOptions: OptionsProps[] = useMemo(() => {
        return (Object.keys(mapConfigs) as MapType[]).map(mapType => {
            const { service } = mapConfigs[mapType];

            return {
                label: PROVIDER_LABELS[mapType],
                options: SERVICE_ORDER.filter(serviceType => !!service[serviceType]).map(
                    serviceType => ({
                        label: serviceLabels[serviceType],
                        value: `${mapType}.${serviceType}`,
                    }),
                ),
            };
        });
    }, [serviceLabels]);

    const { options = defaultOptions, ...restProps } = selectProps || {};

    return <Select options={options} {...restProps} />;
};

export default MapTileSelect;
