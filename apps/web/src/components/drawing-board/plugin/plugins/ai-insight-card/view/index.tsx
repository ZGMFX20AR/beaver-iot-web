import { useMemo } from 'react';
import cls from 'classnames';
import { CircularProgress } from '@mui/material';

import { useI18n, useTime } from '@milesight/shared/src/hooks';
import { ArrowUpwardIcon, ArrowDownwardIcon } from '@milesight/shared/src/components/icons';

import { Tooltip } from '@/components';
import { useSource } from './hooks';
import type { ViewConfigProps } from '../typings';
import type { BoardPluginProps } from '../../../types';
import './style.less';

interface Props {
    widgetId: ApiKey;
    dashboardId: ApiKey;
    config: ViewConfigProps;
    configJson: BoardPluginProps;
}

const View = (props: Props) => {
    const { config, configJson } = props;
    const {
        title,
        entities,
        time,
        aggregateType,
        compareToPreviousPeriod,
        refreshInterval,
        customPrompt,
    } = config || {};
    const { isPreview } = configJson || {};

    const { getIntlText } = useI18n();
    const { getTimeFormat } = useTime();

    const { insight, loading } = useSource({
        entities,
        time,
        aggregateType,
        compareToPreviousPeriod,
        refreshInterval,
        customPrompt,
    });

    const TrendIcon = useMemo(() => {
        if (insight?.trend === 'UP') return ArrowUpwardIcon;
        if (insight?.trend === 'DOWN') return ArrowDownwardIcon;
        return null;
    }, [insight?.trend]);

    return (
        <div className={cls('ai-insight-view', { 'ai-insight-view-preview': isPreview })}>
            <div className="ai-insight-view-card">
                <div className="ai-insight-view-card__header">
                    <Tooltip className="ai-insight-view-card__title" autoEllipsis title={title} />
                </div>
                <div className="ai-insight-view-card__body">
                    {loading && !insight ? (
                        <CircularProgress size={20} />
                    ) : (
                        <div className="ai-insight-view-card__summary">
                            {TrendIcon && (
                                <TrendIcon
                                    className={cls('ai-insight-view-card__trend-icon', {
                                        'ai-insight-view-card__trend-icon--up':
                                            insight?.trend === 'UP',
                                        'ai-insight-view-card__trend-icon--down':
                                            insight?.trend === 'DOWN',
                                    })}
                                    sx={{ fontSize: 18 }}
                                />
                            )}
                            <span>{insight?.summary || getIntlText('dashboard.tip.ai_insight_failed')}</span>
                        </div>
                    )}
                </div>
                {insight?.generated_at && (
                    <div className="ai-insight-view-card__footer">
                        <Tooltip
                            autoEllipsis
                            title={getIntlText('dashboard.label_ai_insight_as_of', {
                                1: getTimeFormat(insight.generated_at),
                            })}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default View;
