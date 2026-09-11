import { useCallback, useMemo, useState } from 'react';
import { useRequest } from 'ahooks';
import { Button, IconButton, Stack } from '@mui/material';
import { type GridColDef } from '@mui/x-data-grid';
import { useI18n } from '@milesight/shared/src/hooks';
import {
    AddIcon,
    DeleteOutlineIcon,
    EditIcon,
    ContentCopyIcon,
    toast,
} from '@milesight/shared/src/components';
import { TablePro, Tooltip, useConfirm, PermissionControlHidden } from '@/components';
import { PERMISSIONS } from '@/constants';
import {
    edgeAiStreamAPI,
    awaitWrap,
    isRequestSuccess,
    getResponseData,
    type CameraSourceType,
} from '@/services/http';
import EditModal from './edit-modal';

import './style.less';

/**
 * Manages the EdgeAI boxes whose camera pipelines can be shown on a dashboard.
 *
 * Lives in Settings rather than under an integration because these are global external
 * sources, not devices.
 */
const CameraSource = () => {
    const { getIntlText } = useI18n();
    const confirm = useConfirm();
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<CameraSourceType | null>(null);

    const {
        data: sources,
        loading,
        run: getSources,
    } = useRequest(
        async () => {
            const [error, resp] = await awaitWrap(edgeAiStreamAPI.getSources());
            if (error || !isRequestSuccess(resp)) return;
            return getResponseData(resp);
        },
        { debounceWait: 300 },
    );

    const handleChanged = useCallback(() => {
        setModalVisible(false);
        setEditing(null);
        getSources();
    }, [getSources]);

    const handleDelete = useCallback(
        (record: CameraSourceType) => {
            confirm({
                title: getIntlText('common.label.delete'),
                description: getIntlText('setting.camera_source.delete_confirm', {
                    1: record.name,
                }),
                type: 'warning',
                onConfirm: async () => {
                    const [error, resp] = await awaitWrap(
                        edgeAiStreamAPI.deleteSource({ id: record.id }),
                    );
                    if (error || !isRequestSuccess(resp)) return;

                    toast.success(getIntlText('common.message.operation_success'));
                    getSources();
                },
            });
        },
        [confirm, getIntlText, getSources],
    );

    /**
     * Copy the widget path for a source. The pipeline id is left as a placeholder because
     * only the user knows which pipeline on that box they want.
     */
    const handleCopyPath = useCallback(
        (record: CameraSourceType) => {
            navigator.clipboard?.writeText(record.stream_path_template);
            toast.success(getIntlText('setting.camera_source.path_copied'));
        },
        [getIntlText],
    );

    const columns: GridColDef<CameraSourceType>[] = useMemo(
        () => [
            {
                field: 'name',
                headerName: getIntlText('common.label.name'),
                flex: 1,
                minWidth: 150,
                ellipsis: true,
            },
            {
                field: 'host',
                headerName: getIntlText('setting.camera_source.host'),
                flex: 1,
                minWidth: 150,
                ellipsis: true,
            },
            {
                field: 'stream_path_template',
                headerName: getIntlText('setting.camera_source.stream_path'),
                flex: 2,
                minWidth: 240,
                renderCell({ row }) {
                    return (
                        <Stack direction="row" alignItems="center" spacing="4px" width="100%">
                            <Tooltip autoEllipsis title={row.stream_path_template} />
                            <Tooltip title={getIntlText('common.label.copy')}>
                                <IconButton size="small" onClick={() => handleCopyPath(row)}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    );
                },
            },
            {
                field: '$operation',
                headerName: getIntlText('common.label.operation'),
                width: 120,
                sortable: false,
                renderCell({ row }) {
                    return (
                        <Stack direction="row" spacing="4px">
                            <Tooltip title={getIntlText('common.button.edit')}>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setEditing(row);
                                        setModalVisible(true);
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={getIntlText('common.label.delete')}>
                                <IconButton size="small" onClick={() => handleDelete(row)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    );
                },
            },
        ],
        [getIntlText, handleDelete, handleCopyPath],
    );

    const toolbarRender = useMemo(
        () => (
            <PermissionControlHidden permissions={PERMISSIONS.SETTING_MODULE}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditing(null);
                        setModalVisible(true);
                    }}
                >
                    {getIntlText('common.label.add')}
                </Button>
            </PermissionControlHidden>
        ),
        [getIntlText],
    );

    return (
        <div className="ms-camera-source">
            <div className="ms-camera-source__intro">
                {getIntlText('setting.camera_source.intro')}
            </div>
            <TablePro<CameraSourceType>
                // Client-side: the list is a handful of boxes and the API returns them all
                // at once, so there is no server pagination to defer to.
                paginationMode="client"
                loading={loading}
                columns={columns}
                rows={sources || []}
                getRowId={row => row.id}
                toolbarRender={toolbarRender}
                onRefreshButtonClick={getSources}
            />
            <EditModal
                data={editing}
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditing(null);
                }}
                onSuccess={handleChanged}
            />
        </div>
    );
};

export default CameraSource;
