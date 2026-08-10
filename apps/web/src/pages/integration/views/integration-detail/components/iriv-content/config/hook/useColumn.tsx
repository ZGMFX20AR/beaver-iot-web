import { useMemo } from 'react';
import { Stack, IconButton } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { DeleteOutlineIcon, SyncIcon, CloudSyncOutlinedIcon } from '@milesight/shared/src/components';
import { Tooltip, type ColumnType } from '@/components';
import GatewayStatus from '../../../ns-content/config/component/gateway-status';

export type EntityRef = { id: ApiKey; key: string };

export type TableRowDataType = {
    id: ApiKey;
    name: string;
    status?: 'ONLINE' | 'OFFLINE';
    channelCount: number;
    resyncEntity?: EntityRef;
    pushSettingsEntity?: EntityRef;
};

type OperationType = 'resync' | 'push' | 'delete';

export interface UseColumnsProps<T> {
    /**
     * Operation Button click callback
     */
    onButtonClick: (type: OperationType, record: T) => void;
}

const useColumns = <T extends TableRowDataType>({ onButtonClick }: UseColumnsProps<T>) => {
    const { getIntlText } = useI18n();

    const columns: ColumnType<T>[] = useMemo(() => {
        return [
            {
                field: 'name',
                headerName: getIntlText('setting.integration.label.gateway_name'),
                flex: 1,
                minWidth: 200,
                ellipsis: true,
            },
            {
                field: 'status',
                headerName: getIntlText('setting.integration.label.status'),
                flex: 1,
                minWidth: 160,
                ellipsis: false,
                renderCell({ row }) {
                    if (!row.status) return null;
                    return (
                        <Stack
                            direction="row"
                            spacing="4px"
                            sx={{ height: '100%', alignItems: 'center' }}
                        >
                            <GatewayStatus status={row.status} />
                        </Stack>
                    );
                },
            },
            {
                field: 'channelCount',
                headerName: 'Channels',
                flex: 1,
                minWidth: 140,
                renderCell({ value }) {
                    return String(value ?? 0);
                },
            },
            {
                field: '$operation',
                headerName: getIntlText('common.label.operation'),
                width: 150,
                display: 'flex',
                align: 'left',
                headerAlign: 'left',
                fixed: 'right',
                renderCell({ row }) {
                    return (
                        <Stack
                            direction="row"
                            spacing="4px"
                            sx={{ height: '100%', alignItems: 'center', justifyContent: 'end' }}
                        >
                            <Tooltip title="Resync Channels">
                                <IconButton
                                    sx={{ width: 30, height: 30 }}
                                    onClick={() => onButtonClick('resync', row)}
                                >
                                    <SyncIcon sx={{ width: 20, height: 20 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Push MQTT Settings">
                                <IconButton
                                    sx={{ width: 30, height: 30 }}
                                    onClick={() => onButtonClick('push', row)}
                                >
                                    <CloudSyncOutlinedIcon sx={{ width: 20, height: 20 }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={getIntlText('common.label.delete')}>
                                <IconButton
                                    sx={{ width: 30, height: 30, color: 'text.secondary' }}
                                    onClick={() => onButtonClick('delete', row)}
                                >
                                    <DeleteOutlineIcon sx={{ width: 20, height: 20 }} />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    );
                },
            },
        ];
    }, [getIntlText, onButtonClick]);

    return columns;
};

export default useColumns;
