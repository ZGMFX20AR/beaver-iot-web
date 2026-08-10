import React, { useState } from 'react';
import { Button, DialogActions, Alert } from '@mui/material';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { useMemoizedFn } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { LoadingButton } from '@milesight/shared/src/components';
import { awaitWrap, isRequestSuccess, getResponseData, irivIocApi } from '@/services/http';
import useFormItems, { type ConnectionFormType } from './hook/useFormItems';

export type { ConnectionFormType };

export interface ConnectionResultType {
    formData: ConnectionFormType;
    preview: {
        device_name?: string;
        di_count: number;
        do_count: number;
        ai_count: number;
        poll_job_count: number;
        write_job_count: number;
    };
}

interface IProps {
    data: ConnectionFormType | null;
    onCancel: () => void;
    onNext: (result: ConnectionResultType) => void;
}

/** Add Gateway wizard step 1: collect connection info and test it before moving on */
const Connection: React.FC<IProps> = ({ data, onCancel, onNext }) => {
    const { getIntlText } = useI18n();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { control, handleSubmit } = useForm<ConnectionFormType>({
        shouldUnregister: true,
        defaultValues: {
            name: data?.name,
            host: data?.host,
            username: data?.username,
            password: data?.password,
        },
    });
    const formItems = useFormItems();

    const handleNextStep: SubmitHandler<ConnectionFormType> = useMemoizedFn(async formData => {
        setErrorMessage(null);
        setLoading(true);
        const [err, resp] = await awaitWrap(
            irivIocApi.validateConnection({
                host: formData.host,
                username: formData.username,
                password: formData.password,
            }),
        );
        setLoading(false);

        if (err || !isRequestSuccess(resp)) {
            // the generic error toast only shows a canned "server error" message for this error code,
            // so surface the gateway's actual error (wrong credentials, unreachable, etc.) inline instead
            const message =
                (err as any)?.response?.data?.error_message ||
                'Could not connect to the gateway. Check the IP address and credentials.';
            setErrorMessage(message);
            return;
        }

        const preview = getResponseData(resp);
        if (!preview) {
            setErrorMessage('Gateway responded, but no data was returned.');
            return;
        }

        onNext({ formData, preview });
    });

    return (
        <div>
            {errorMessage && (
                <Alert severity="error" sx={{ my: 1.5 }}>
                    {errorMessage}
                </Alert>
            )}
            {formItems.map(({ shouldRender, ...props }) => (
                <Controller<ConnectionFormType> {...props} key={props.name} control={control} />
            ))}
            <DialogActions>
                <Button variant="outlined" sx={{ height: 36, textTransform: 'none' }} onClick={onCancel}>
                    {getIntlText('common.button.cancel')}
                </Button>
                <LoadingButton
                    variant="contained"
                    loading={loading}
                    onClick={handleSubmit(handleNextStep)}
                    sx={{ height: 36 }}
                >
                    Test Connection
                </LoadingButton>
            </DialogActions>
        </div>
    );
};

export default Connection;
