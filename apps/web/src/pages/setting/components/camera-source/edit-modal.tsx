import React, { useMemo, useEffect } from 'react';
import { TextField } from '@mui/material';
import { useForm, Controller, type SubmitHandler, type ControllerProps } from 'react-hook-form';
import { useI18n } from '@milesight/shared/src/hooks';
import { Modal, toast, type ModalProps } from '@milesight/shared/src/components';
import { checkRequired } from '@milesight/shared/src/utils/validators';
import {
    edgeAiStreamAPI,
    awaitWrap,
    isRequestSuccess,
    type CameraSourceType,
} from '@/services/http';

interface EditModalProps extends Omit<ModalProps, 'onOk'> {
    /** Source being edited; omit to add a new one */
    data?: CameraSourceType | null;
    onSuccess?: () => void | Promise<void>;
}

interface FormDataProps {
    name: string;
    host: string;
    apiKey: string;
}

const EditModal: React.FC<EditModalProps> = ({ data, visible, onSuccess, ...props }) => {
    const { getIntlText } = useI18n();
    const isEdit = !!data;
    const { control, handleSubmit, reset, setValue } = useForm<FormDataProps>();

    const formItems = useMemo(() => {
        const result: ControllerProps<FormDataProps>[] = [
            {
                name: 'name',
                rules: { validate: { checkRequired: checkRequired() } },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <TextField
                            required
                            fullWidth
                            margin="dense"
                            label={getIntlText('common.label.name')}
                            placeholder={getIntlText('setting.camera_source.name_placeholder')}
                            error={!!error}
                            helperText={error?.message}
                            value={value || ''}
                            onChange={onChange}
                        />
                    );
                },
            },
            {
                name: 'host',
                rules: { validate: { checkRequired: checkRequired() } },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <TextField
                            required
                            fullWidth
                            margin="dense"
                            label={getIntlText('setting.camera_source.host')}
                            placeholder="192.168.1.238"
                            error={!!error}
                            helperText={
                                error?.message || getIntlText('setting.camera_source.host_helper')
                            }
                            value={value || ''}
                            onChange={onChange}
                        />
                    );
                },
            },
            {
                name: 'apiKey',
                // Required only when adding. On edit a blank field means "keep the key you
                // already have", which is the only sensible option given the key is never
                // read back for display.
                rules: isEdit ? {} : { validate: { checkRequired: checkRequired() } },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <TextField
                            required={!isEdit}
                            fullWidth
                            margin="dense"
                            type="password"
                            autoComplete="new-password"
                            label={getIntlText('setting.camera_source.api_key')}
                            error={!!error}
                            helperText={
                                error?.message ||
                                getIntlText(
                                    isEdit
                                        ? 'setting.camera_source.api_key_edit_helper'
                                        : 'setting.camera_source.api_key_helper',
                                )
                            }
                            value={value || ''}
                            onChange={onChange}
                        />
                    );
                },
            },
        ];

        return result;
    }, [isEdit, getIntlText]);

    const handleOk: SubmitHandler<FormDataProps> = async ({ name, host, apiKey }) => {
        const payload = {
            name: name.trim(),
            host: host.trim(),
            api_key: apiKey?.trim() || undefined,
        };
        const [error, resp] = await awaitWrap(
            isEdit
                ? edgeAiStreamAPI.updateSource({ ...payload, id: data!.id })
                : edgeAiStreamAPI.addSource(payload),
        );

        if (error || !isRequestSuccess(resp)) return;

        toast.success(getIntlText('common.message.operation_success'));
        onSuccess?.();
    };

    useEffect(() => {
        if (!visible) {
            reset();
            return;
        }

        // Name and host are filled in from the existing source; the key deliberately is
        // not, because the API never returns it.
        setValue('name', data?.name || '');
        setValue('host', data?.host || '');
        setValue('apiKey', '');
    }, [data, visible, reset, setValue]);

    return (
        <Modal
            size="lg"
            title={getIntlText(
                isEdit ? 'setting.camera_source.edit_title' : 'setting.camera_source.add_title',
            )}
            {...props}
            visible={visible}
            onOk={handleSubmit(handleOk)}
        >
            {formItems.map(item => (
                <Controller<FormDataProps> {...item} key={item.name} control={control} />
            ))}
        </Modal>
    );
};

export default EditModal;
