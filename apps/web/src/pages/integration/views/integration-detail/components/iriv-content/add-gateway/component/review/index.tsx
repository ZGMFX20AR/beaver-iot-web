import React, { useState } from 'react';
import { Button, DialogActions, Alert, Stack, Typography } from '@mui/material';
import { useMemoizedFn } from 'ahooks';
import { useI18n } from '@milesight/shared/src/hooks';
import { LoadingButton, toast } from '@milesight/shared/src/components';
import { awaitWrap, isRequestSuccess, deviceAPI } from '@/services/http';
import type { ConnectionResultType } from '../connection';

interface IProps {
    result: ConnectionResultType | null;
    onBack: () => void;
    onSuccess: () => void;
}

/** Add Gateway wizard step 2: show what was found, confirm to actually create the device */
const Review: React.FC<IProps> = ({ result, onBack, onSuccess }) => {
    const { getIntlText } = useI18n();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleConfirm = useMemoizedFn(async () => {
        if (!result) return;
        const { formData } = result;

        setErrorMessage(null);
        setLoading(true);
        const [err, resp] = await awaitWrap(
            deviceAPI.addDevice({
                integration: 'iriv-ioc-mqtt-gateway',
                name: formData.name?.trim(),
                param_entities: {
                    'iriv-ioc-mqtt-gateway.integration.add_device.host': formData.host,
                    'iriv-ioc-mqtt-gateway.integration.add_device.username': formData.username,
                    'iriv-ioc-mqtt-gateway.integration.add_device.password': formData.password,
                },
            }),
        );
        setLoading(false);

        if (err || !isRequestSuccess(resp)) {
            const message =
                (err as any)?.response?.data?.error_message ||
                'Could not add the gateway. Please try again.';
            setErrorMessage(message);
            return;
        }

        toast.success(getIntlText('common.message.add_success'));
        onSuccess();
    });

    const preview = result?.preview;

    return (
        <div>
            {errorMessage && (
                <Alert severity="error" sx={{ my: 1.5 }}>
                    {errorMessage}
                </Alert>
            )}
            <Alert severity="success" sx={{ my: 1.5 }}>
                Connected to &ldquo;{preview?.device_name || 'the gateway'}&rdquo;. Beaver IoT will
                take over its MQTT settings so it reports to this platform.
            </Alert>
            <Stack spacing={1} sx={{ my: 1.5 }}>
                <Typography variant="body2">Digital Inputs enabled: {preview?.di_count ?? 0}</Typography>
                <Typography variant="body2">Digital Outputs enabled: {preview?.do_count ?? 0}</Typography>
                <Typography variant="body2">Analog Inputs enabled: {preview?.ai_count ?? 0}</Typography>
                <Typography variant="body2">Modbus poll jobs enabled: {preview?.poll_job_count ?? 0}</Typography>
                <Typography variant="body2">Modbus write jobs enabled: {preview?.write_job_count ?? 0}</Typography>
            </Stack>
            <DialogActions>
                <Button variant="outlined" sx={{ height: 36, textTransform: 'none' }} onClick={onBack}>
                    {getIntlText('common.button.previous')}
                </Button>
                <LoadingButton
                    variant="contained"
                    loading={loading}
                    onClick={handleConfirm}
                    sx={{ height: 36 }}
                >
                    {getIntlText('common.button.confirm')}
                </LoadingButton>
            </DialogActions>
        </div>
    );
};

export default Review;
