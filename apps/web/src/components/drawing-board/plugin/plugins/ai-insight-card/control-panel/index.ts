import { t } from '@milesight/shared/src/utils/tools';

import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import AiInsightCardIcon from '../icon.svg';

export interface AiInsightCardControlPanelProps {
    title?: string;
    entities: EntityOptionType[];
    time: number;
    aggregateType: DataAggregateType;
    compareToPreviousPeriod: boolean;
    refreshInterval: number;
    customPrompt?: string;
}

/**
 * The AI Insight Card Control Panel Config
 */
const aiInsightCardControlPanelConfig = (): ControlPanelConfig<AiInsightCardControlPanelProps> => {
    return {
        class: 'data_card',
        type: 'aiInsightCard',
        name: 'dashboard.plugin_name_ai_insight_card',
        icon: AiInsightCardIcon,
        defaultRow: 2,
        defaultCol: 3,
        minRow: 2,
        minCol: 2,
        maxRow: 4,
        maxCol: 6,
        configProps: [
            {
                label: 'AI Insight Card Config',
                controlSetItems: [
                    {
                        name: 'input',
                        config: {
                            type: 'Input',
                            label: t('common.label.title'),
                            controllerProps: {
                                name: 'title',
                                defaultValue: t('dashboard.plugin_name_ai_insight_card'),
                                rules: {
                                    maxLength: 35,
                                },
                            },
                        },
                    },
                    {
                        name: 'multiEntitySelect',
                        config: {
                            type: 'MultiEntitySelect',
                            label: t('common.label.entity'),
                            controllerProps: {
                                name: 'entities',
                                defaultValue: [],
                                rules: {
                                    required: true,
                                },
                            },
                            componentProps: {
                                required: true,
                                maxCount: 5,
                                entityType: ['PROPERTY'],
                                entityValueType: ['LONG', 'DOUBLE'],
                                entityAccessMod: ['R', 'RW'],
                            },
                        },
                    },
                    {
                        name: 'input',
                        config: {
                            type: 'Input',
                            label: t('dashboard.label_ai_insight_custom_prompt'),
                            description: t('dashboard.helper_ai_insight_custom_prompt'),
                            controllerProps: {
                                name: 'customPrompt',
                                defaultValue: '',
                                rules: {
                                    maxLength: 500,
                                },
                            },
                            componentProps: {
                                multiline: true,
                                minRows: 2,
                                maxRows: 5,
                                placeholder: t('dashboard.placeholder_ai_insight_custom_prompt'),
                                helperText: t('dashboard.example_ai_insight_custom_prompt'),
                            },
                        },
                    },
                    {
                        name: 'chartTimeSelect',
                        config: {
                            type: 'ChartTimeSelect',
                            label: t('common.label.time'),
                            controllerProps: {
                                name: 'time',
                                defaultValue: 86400000,
                            },
                            componentProps: {
                                style: {
                                    width: '100%',
                                },
                            },
                        },
                    },
                    {
                        name: 'chartMetricsSelect',
                        config: {
                            type: 'ChartMetricsSelect',
                            label: t('common.label.metrics'),
                            controllerProps: {
                                name: 'aggregateType',
                                defaultValue: 'AVG',
                            },
                            componentProps: {
                                filters: ['LAST', 'COUNT'],
                                style: {
                                    width: '100%',
                                },
                            },
                        },
                    },
                    {
                        name: 'toggleRadio',
                        config: {
                            type: 'ToggleRadio',
                            label: t('dashboard.label_ai_insight_compare_previous_period'),
                            controllerProps: {
                                name: 'compareToPreviousPeriod',
                                defaultValue: true,
                            },
                            componentProps: {
                                options: [
                                    { label: t('dashboard.switch_title_on'), value: true },
                                    { label: t('dashboard.switch_title_off'), value: false },
                                ],
                            },
                        },
                    },
                    {
                        name: 'toggleRadio',
                        config: {
                            type: 'ToggleRadio',
                            label: t('dashboard.label_ai_insight_refresh_interval'),
                            controllerProps: {
                                name: 'refreshInterval',
                                defaultValue: 3600,
                            },
                            componentProps: {
                                options: [
                                    { label: t('dashboard.label_ai_insight_refresh_15m'), value: 900 },
                                    { label: t('dashboard.label_ai_insight_refresh_1h'), value: 3600 },
                                    { label: t('dashboard.label_ai_insight_refresh_6h'), value: 21600 },
                                    { label: t('dashboard.label_ai_insight_refresh_1d'), value: 86400 },
                                ],
                            },
                        },
                    },
                ],
            },
        ],
    };
};

export default aiInsightCardControlPanelConfig;
