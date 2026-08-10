import { useCallback, useMemo, useState } from 'react';
import { Button, Stack } from '@mui/material';
import { useRequest } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { AddIcon, DeleteOutlineIcon, toast } from '@milesight/shared/src/components';
import { TablePro, useConfirm } from '@/components';
import { awaitWrap, isRequestSuccess, getResponseData, deviceAPI, entityAPI } from '@/services/http';
import useColumns, { type TableRowDataType, type UseColumnsProps } from './hook/useColumn';
import AddGateway from '../add-gateway/addGateway';

import './style.less';

const INTEGRATION_ID = 'iriv-ioc-mqtt-gateway';
const RESYNC_IDENTIFIER = 'resync_channels';
const PUSH_SETTINGS_IDENTIFIER = 'push_mqtt_settings';

interface IProps {
    /** Edit successful callback */
    onUpdateSuccess?: () => void;
}

/**
 * IRIV-IOC MQTT Gateway list
 */
const Config: React.FC<IProps> = ({ onUpdateSuccess }) => {
    const { getIntlText } = useI18n();
    const confirm = useConfirm();
    const [addOpen, setAddOpen] = useState(false);
    const [keyword, setKeyword] = useState<string>();
    const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
    const [selectedIds, setSelectedIds] = useState<readonly ApiKey[]>([]);

    // ---------- list data related to ----------
    const {
        data: gatewayList,
        loading,
        run: getGatewayList,
    } = useRequest(
        async () => {
            const [error, resp] = await awaitWrap(deviceAPI.getList({ page_size: 999, page_number: 1 }));
            const data = getResponseData(resp);
            if (error || !data || !isRequestSuccess(resp)) return [];

            const gateways = (data.content || []).filter(device => device.integration === INTEGRATION_ID);

            const rows = await Promise.all(
                gateways.map(async (device): Promise<TableRowDataType> => {
                    // `deviceAPI.getDetail` only returns curated important/common entity subsets,
                    // not the full per-device channel list - the entity search endpoint filtered
                    // by DEVICE_ID is what the device detail page's own entity tab uses instead.
                    const [, entitiesResp] = await awaitWrap(
                        entityAPI.advancedSearch({
                            page_size: 200,
                            page_number: 1,
                            entity_filter: {
                                DEVICE_ID: { operator: 'EQ', values: [device.id] },
                            },
                        }),
                    );
                    const entities = getResponseData(entitiesResp)?.content || [];

                    let channelCount = 0;
                    let resyncEntity: TableRowDataType['resyncEntity'];
                    let pushSettingsEntity: TableRowDataType['pushSettingsEntity'];

                    entities.forEach(entity => {
                        // The entity search response has no standalone `identifier` field (only the
                        // compound `entity_key`, formatted as
                        // "{integrationId}.device.{deviceIdentifier}.{entityIdentifier}"), so the
                        // resync/push service entities have to be picked out by key suffix instead.
                        const key = String(entity.entity_key);
                        if (key.endsWith(`.${RESYNC_IDENTIFIER}`)) {
                            resyncEntity = { id: entity.entity_id, key };
                            return;
                        }
                        if (key.endsWith(`.${PUSH_SETTINGS_IDENTIFIER}`)) {
                            pushSettingsEntity = { id: entity.entity_id, key };
                            return;
                        }
                        if (entity.entity_type === 'PROPERTY') {
                            channelCount += 1;
                        }
                    });

                    return {
                        id: device.id,
                        name: device.name,
                        status: device.status,
                        channelCount,
                        resyncEntity,
                        pushSettingsEntity,
                    };
                }),
            );

            return rows;
        },
        { debounceWait: 300 },
    );

    // Client-side search + pagination: the generic device search endpoint has no
    // integration filter, so the full device list is fetched once and narrowed here.
    const tableData = useMemo(() => {
        const all = gatewayList || [];
        const search = keyword?.trim().toLocaleLowerCase();
        const filtered = search
            ? all.filter(row => row.name?.toLocaleLowerCase().includes(search))
            : all;
        const { page, pageSize } = paginationModel;
        const start = page * pageSize;

        return {
            content: filtered.slice(start, start + pageSize),
            total: filtered.length,
        };
    }, [gatewayList, keyword, paginationModel]);

    // ---------- Data Deletion related ----------
    const handleDeleteConfirm = useCallback(
        (ids?: ApiKey[]) => {
            const idsToDelete = ids || [...selectedIds];
            if (!idsToDelete.length) return;

            confirm({
                title: getIntlText(
                    idsToDelete.length > 1 ? 'common.label.bulk_deletion' : 'common.label.delete',
                ),
                description: getIntlText('device.message.delete_tip'),
                confirmButtonText: getIntlText('common.label.delete'),
                type: 'warning',
                onConfirm: async () => {
                    const [error, resp] = await awaitWrap(
                        deviceAPI.deleteDevices({ device_id_list: idsToDelete }),
                    );

                    if (error || !isRequestSuccess(resp)) return;

                    setSelectedIds(ids => ids.filter(id => !idsToDelete.includes(id)));
                    getGatewayList();
                    onUpdateSuccess?.();
                    toast.success(getIntlText('common.message.delete_success'));
                },
            });
        },
        [confirm, getIntlText, getGatewayList, onUpdateSuccess, selectedIds],
    );

    // ---------- Per-row service actions ----------
    const callDeviceService = useCallback(
        (
            entity: TableRowDataType['resyncEntity'],
            confirmTitle: string,
            successMessage: string,
        ) => {
            if (!entity) return;

            confirm({
                title: confirmTitle,
                description: getIntlText('dashboard.plugin.trigger_confirm_text'),
                confirmButtonText: getIntlText('common.button.confirm'),
                onConfirm: async () => {
                    const [error, resp] = await awaitWrap(
                        entityAPI.callService({
                            entity_id: entity.id,
                            exchange: { [entity.key]: null },
                        }),
                    );
                    if (error || !isRequestSuccess(resp)) return;
                    toast.success(successMessage);
                },
            });
        },
        [confirm, getIntlText],
    );

    const handleTableBtnClick: UseColumnsProps<TableRowDataType>['onButtonClick'] = useCallback(
        (type, record) => {
            switch (type) {
                case 'resync': {
                    callDeviceService(record.resyncEntity, 'Resync Channels', 'Resync triggered');
                    break;
                }
                case 'push': {
                    callDeviceService(
                        record.pushSettingsEntity,
                        'Push MQTT Settings',
                        'MQTT settings pushed',
                    );
                    break;
                }
                case 'delete': {
                    handleDeleteConfirm([record.id]);
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [callDeviceService, handleDeleteConfirm],
    );

    const columns = useColumns<TableRowDataType>({ onButtonClick: handleTableBtnClick });

    // ---------- Table rendering related to ----------
    const toolbarRender = useMemo(() => {
        return (
            <Stack className="ms-operations-btns" direction="row" spacing="12px">
                <Button
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                    startIcon={<AddIcon />}
                    onClick={() => setAddOpen(true)}
                >
                    {getIntlText('common.label.add')}
                </Button>
                <Button
                    variant="outlined"
                    disabled={!selectedIds.length}
                    sx={{ textTransform: 'none' }}
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => handleDeleteConfirm()}
                >
                    {getIntlText('common.label.delete')}
                </Button>
            </Stack>
        );
    }, [getIntlText, handleDeleteConfirm, selectedIds]);

    return (
        <div className="ms-view ms-view-iriv">
            <div className="ms-view-inner">
                <TablePro<TableRowDataType>
                    filterCondition={[keyword]}
                    checkboxSelection
                    getRowId={(row: TableRowDataType) => row.id}
                    loading={loading}
                    columns={columns}
                    rows={tableData.content}
                    rowCount={tableData.total}
                    paginationModel={paginationModel}
                    rowSelectionModel={selectedIds}
                    toolbarRender={toolbarRender}
                    onPaginationModelChange={setPaginationModel}
                    onRowSelectionModelChange={setSelectedIds}
                    onSearch={value => {
                        setKeyword(value);
                        setPaginationModel(model => ({ ...model, page: 0 }));
                    }}
                    onRefreshButtonClick={getGatewayList}
                />
            </div>
            {addOpen && (
                <AddGateway
                    visible={addOpen}
                    onCancel={() => setAddOpen(false)}
                    onUpdateSuccess={onUpdateSuccess}
                    refreshTable={getGatewayList}
                />
            )}
        </div>
    );
};

export default Config;
