import { useEffect, useMemo } from 'react';
import { useRequest } from 'ahooks';
import { entityAPI, awaitWrap, isRequestSuccess, getResponseData } from '@/services/http';
import type { ViewConfigProps } from '../../typings';

export interface UseSourceProps {
    entities?: ViewConfigProps['entities'];
    time: ViewConfigProps['time'];
    aggregateType: ViewConfigProps['aggregateType'];
    compareToPreviousPeriod: ViewConfigProps['compareToPreviousPeriod'];
    refreshInterval: ViewConfigProps['refreshInterval'];
    customPrompt?: ViewConfigProps['customPrompt'];
}

/**
 * Fetches the AI-generated insight for the configured entities/period, and re-fetches
 * on config change and on the widget's own configured refresh cadence.
 */
export const useSource = (props: UseSourceProps) => {
    const { entities, time, aggregateType, compareToPreviousPeriod, refreshInterval, customPrompt } =
        props;

    const entityKeys = useMemo(
        () =>
            (entities || [])
                .map(entity => entity?.rawData?.entityKey)
                .filter((key): key is string => Boolean(key)),
        [entities],
    );

    const {
        data: insight,
        loading,
        run: fetchInsight,
    } = useRequest(
        async () => {
            if (!entityKeys.length || !time) return;

            const now = Date.now();
            const [error, resp] = await awaitWrap(
                entityAPI.getAiInsight({
                    entity_keys: entityKeys,
                    start_timestamp: now - time,
                    end_timestamp: now,
                    aggregate_type: aggregateType || 'AVG',
                    compare_to_previous_period: Boolean(compareToPreviousPeriod),
                    cache_ttl_seconds: refreshInterval || 3600,
                    custom_prompt: customPrompt || undefined,
                }),
            );
            if (error || !isRequestSuccess(resp)) return;

            return getResponseData(resp);
        },
        {
            manual: true,
            debounceWait: 300,
            refreshDeps: [
                entityKeys,
                time,
                aggregateType,
                compareToPreviousPeriod,
                refreshInterval,
                customPrompt,
            ],
        },
    );

    useEffect(() => {
        fetchInsight();
    }, [
        entityKeys,
        time,
        aggregateType,
        compareToPreviousPeriod,
        refreshInterval,
        customPrompt,
        fetchInsight,
    ]);

    useEffect(() => {
        if (!refreshInterval) return;

        const timer = setInterval(fetchInsight, refreshInterval * 1000);
        return () => clearInterval(timer);
    }, [refreshInterval, fetchInsight]);

    return {
        insight,
        loading,
    };
};
