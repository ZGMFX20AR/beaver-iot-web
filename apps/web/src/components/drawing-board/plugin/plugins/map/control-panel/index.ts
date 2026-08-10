import { t } from '@milesight/shared/src/utils/tools';

import type { MapTileType } from '@/services/map';
import type { ControlPanelConfig } from '@/components/drawing-board/plugin/types';
import type { DeviceSelectData } from '../../../components';
import MapIcon from '../Map.svg';

/**
 * Base layer used when a widget was created before the layer option existed.
 */
export const DEFAULT_MAP_TILE_TYPE: MapTileType = 'openStreet.normal';

export interface MapConfigType {
    title: string;
    devices?: DeviceSelectData[];
    tileType?: MapTileType;
    /** Whether to draw each device's recent movement as a line */
    trail?: 'on' | 'off';
    /** How far back the trail reaches, in milliseconds */
    trailTime?: number;
}

/**
 * The Map Control Panel Config
 */
const mapControlPanelConfig = (): ControlPanelConfig<MapConfigType> => {
    return {
        class: 'data_card',
        type: 'map',
        name: 'dashboard.plugin_name_map',
        icon: MapIcon,
        defaultRow: 4,
        defaultCol: 4,
        minRow: 4,
        minCol: 4,
        maxRow: 12,
        maxCol: 12,
        fullscreenable: true,
        configProps: [
            {
                label: 'map config',
                controlSetItems: [
                    {
                        name: 'input',
                        config: {
                            type: 'Input',
                            label: t('common.label.title'),
                            controllerProps: {
                                name: 'title',
                                defaultValue: t('dashboard.plugin_name_map'),
                                rules: {
                                    maxLength: 35,
                                },
                            },
                        },
                    },
                    {
                        name: 'mapTileSelect',
                        config: {
                            type: 'MapTileSelect',
                            label: t('dashboard.label_map_layer'),
                            controllerProps: {
                                name: 'tileType',
                                defaultValue: DEFAULT_MAP_TILE_TYPE,
                            },
                            componentProps: {
                                style: {
                                    width: '100%',
                                    // Match the title input's vertical rhythm (theme spacing
                                    // 1.5 = 12px) so the device list height calculation
                                    // below stays a whole multiple of 78px per control.
                                    marginTop: '12px',
                                    marginBottom: '12px',
                                },
                            },
                        },
                    },
                    {
                        name: 'trailRadio',
                        config: {
                            type: 'ToggleRadio',
                            label: t('dashboard.label_map_trail'),
                            description: t('dashboard.label_map_trail_tip'),
                            controllerProps: {
                                name: 'trail',
                                defaultValue: 'off',
                            },
                            componentProps: {
                                options: [
                                    { label: t('dashboard.switch_title_off'), value: 'off' },
                                    { label: t('dashboard.switch_title_on'), value: 'on' },
                                ],
                            },
                        },
                    },
                    {
                        name: 'trailTimeSelect',
                        config: {
                            type: 'ChartTimeSelect',
                            label: t('dashboard.label_map_trail_range'),
                            controllerProps: {
                                name: 'trailTime',
                                defaultValue: 86400000,
                            },
                            componentProps: {
                                style: {
                                    width: '100%',
                                    marginTop: '12px',
                                    marginBottom: '12px',
                                },
                            },
                            // Only meaningful once the trail is switched on.
                            visibility: (formData?: MapConfigType) => formData?.trail === 'on',
                        },
                    },
                    {
                        name: 'multiDeviceSelect',
                        config: {
                            type: 'MultiDeviceSelect',
                            controllerProps: {
                                name: 'devices',
                                rules: {
                                    required: true,
                                },
                            },
                            componentProps: {
                                required: true,
                                sx: {
                                    // Leaves room for the controls above (title, layer, trail
                                    // toggle, and the trail range when shown). The panel itself
                                    // scrolls, so a device list slightly taller than the space
                                    // left is harmless.
                                    height: 'calc(100% - 240px)',
                                    minHeight: '200px',
                                },
                                locationRequired: true,
                            },
                        },
                    },
                ],
            },
        ],
    };
};

export default mapControlPanelConfig;
