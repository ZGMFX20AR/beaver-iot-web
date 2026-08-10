import { useCallback, useState } from 'react';
import { Button, IconButton, Stack, Tooltip as MuiTooltip } from '@mui/material';
import { useRequest } from 'ahooks';

import { useI18n } from '@milesight/shared/src/hooks';
import { objectToCamelCase } from '@milesight/shared/src/utils/tools';
import {
    Modal,
    toast,
    AddIcon,
    DeleteOutlineIcon,
    EditIcon,
} from '@milesight/shared/src/components';
import { useConfirm } from '@/components';
import {
    awaitWrap,
    isRequestSuccess,
    getResponseData,
    embeddedNSApi,
    type CustomDeviceModelType,
} from '@/services/http';
import Editor from './editor';

import './style.less';

interface IProps {
    onCancel: () => void;
    /** Called after any change, so the caller can refresh the device model picker */
    onUpdateSuccess?: () => void;
}

/**
 * Manage custom device models - device models defined here rather than resolved from the
 * blueprint library, so a device that is not published upstream can still be added.
 */
const CustomDeviceModel: React.FC<IProps> = ({ onCancel, onUpdateSuccess }) => {
    const { getIntlText } = useI18n();
    const confirm = useConfirm();

    const [editorOpen, setEditorOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<CustomDeviceModelType | null>(null);

    const {
        data: models,
        loading,
        run: getModels,
    } = useRequest(
        async () => {
            const [error, resp] = await awaitWrap(embeddedNSApi.getCustomDeviceModels());
            const data = getResponseData(resp);
            if (error || !data || !isRequestSuccess(resp)) return [];
            return data;
        },
        { debounceWait: 300 },
    );

    const handleChanged = useCallback(() => {
        setEditorOpen(false);
        setEditingModel(null);
        getModels();
        onUpdateSuccess?.();
    }, [getModels, onUpdateSuccess]);

    const handleDelete = useCallback(
        (model: CustomDeviceModelType) => {
            confirm({
                title: getIntlText('setting.integration.custom_model_delete_title'),
                description: getIntlText('setting.integration.custom_model_delete_tip'),
                confirmButtonText: getIntlText('common.button.confirm'),
                type: 'warning',
                onConfirm: async () => {
                    const [error, resp] = await awaitWrap(
                        embeddedNSApi.deleteCustomDeviceModel({ identifier: model.identifier }),
                    );
                    if (error || !isRequestSuccess(resp)) return;

                    toast.success(getIntlText('common.message.operation_success'));
                    handleChanged();
                },
            });
        },
        [confirm, getIntlText, handleChanged],
    );

    return (
        <>
            <Modal
                visible
                showCloseIcon
                footer={null}
                width="760px"
                title={getIntlText('setting.integration.custom_model_title')}
                onCancel={onCancel}
            >
                <div className="ms-custom-device-model">
                    <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ textTransform: 'none' }}
                            onClick={() => {
                                setEditingModel(null);
                                setEditorOpen(true);
                            }}
                        >
                            {getIntlText('setting.integration.custom_model_add_title')}
                        </Button>
                    </Stack>

                    {!loading && !models?.length && (
                        <div className="ms-custom-device-model__empty">
                            {getIntlText('setting.integration.custom_model_empty')}
                        </div>
                    )}

                    {(models || []).map(rawModel => {
                        const model = objectToCamelCase(rawModel) as any;
                        return (
                            <div className="ms-custom-device-model__item" key={model.identifier}>
                                <div className="ms-custom-device-model__item-info">
                                    <div className="ms-custom-device-model__item-name">
                                        {model.name}
                                    </div>
                                    <div className="ms-custom-device-model__item-desc">
                                        {model.description ||
                                            getIntlText(
                                                'setting.integration.custom_model_no_description',
                                            )}
                                    </div>
                                </div>
                                <Stack direction="row" spacing="4px">
                                    <MuiTooltip title={getIntlText('common.button.edit')}>
                                        <IconButton
                                            onClick={() => {
                                                setEditingModel(rawModel);
                                                setEditorOpen(true);
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </MuiTooltip>
                                    <MuiTooltip title={getIntlText('common.label.delete')}>
                                        <IconButton onClick={() => handleDelete(rawModel)}>
                                            <DeleteOutlineIcon />
                                        </IconButton>
                                    </MuiTooltip>
                                </Stack>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {editorOpen && (
                <Editor
                    model={editingModel}
                    onCancel={() => {
                        setEditorOpen(false);
                        setEditingModel(null);
                    }}
                    onSuccess={handleChanged}
                />
            )}
        </>
    );
};

export default CustomDeviceModel;
