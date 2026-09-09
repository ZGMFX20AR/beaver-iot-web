import { useState } from 'react';
import cls from 'classnames';
import { useRequest } from 'ahooks';
import { IconButton, Button, Divider, Alert, TextField, Stack } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import {
    CloseIcon,
    PlayArrowIcon,
    CheckCircleIcon,
    ErrorIcon,
} from '@milesight/shared/src/components';
import { CodeEditor } from '@/components';
import {
    embeddedNSApi,
    awaitWrap,
    getResponseData,
    isRequestSuccess,
    type GatewayAPISchema,
} from '@/services/http';
import './style.less';

type TestCodecResult = GatewayAPISchema['testCustomDeviceModelCodec']['response'];

export interface TestCodecPanelProps {
    open: boolean;
    onClose: () => void;
    /** The editor's current, possibly unsaved values - not what's been saved for the model */
    codecCode: string;
    codecEntry: string;
}

/**
 * Lets a user decode a sample payload with the codec editor's current (possibly
 * unsaved) code, so they can confirm it actually works before saving the model or
 * adding a real device. Nothing here is persisted.
 */
const TestCodecPanel: React.FC<TestCodecPanelProps> = ({
    open,
    onClose,
    codecCode,
    codecEntry,
}) => {
    const { getIntlText } = useI18n();
    const [payloadHex, setPayloadHex] = useState('');
    const [fPort, setFPort] = useState('1');

    const {
        loading,
        data: testResult,
        run: runTest,
        mutate,
    } = useRequest(
        // Every path returns a result and nothing is allowed to throw: ahooks keeps the
        // previous `data` when a request rejects (it only sets `error`), so returning
        // undefined or throwing here would leave the *last* run's output on screen with
        // no indication it's stale - which reads as "the test only runs once, the result
        // never changes" rather than as the failure it actually is.
        async (): Promise<TestCodecResult> => {
            try {
                const [error, resp] = await awaitWrap(
                    embeddedNSApi.testCustomDeviceModelCodec({
                        codec_code: codecCode,
                        codec_entry: codecEntry,
                        payload_hex: payloadHex,
                        f_port: Number(fPort) || 0,
                    }),
                );
                const data = !error && isRequestSuccess(resp) ? getResponseData(resp) : undefined;

                return (
                    data ?? {
                        success: false,
                        error_message: getIntlText('error.http.server_error'),
                    }
                );
            } catch (e) {
                return {
                    success: false,
                    error_message: (e as Error)?.message || getIntlText('error.http.server_error'),
                };
            }
        },
        { manual: true },
    );

    return (
        <div className={cls('ms-test-codec-panel', { open })}>
            <div className="ms-test-codec-panel__header">
                <span>{getIntlText('setting.integration.custom_model_test_codec_title')}</span>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </div>
            <div className="ms-test-codec-panel__body">
                <Stack direction="row" spacing="8px">
                    <TextField
                        fullWidth
                        label={getIntlText('setting.integration.custom_model_test_codec_payload')}
                        placeholder="01 AA BB CC"
                        value={payloadHex}
                        onChange={e => setPayloadHex(e.target.value)}
                    />
                    <TextField
                        sx={{ width: 120 }}
                        label={getIntlText('setting.integration.custom_model_test_codec_fport')}
                        value={fPort}
                        onChange={e => setFPort(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                </Stack>
                <Button
                    fullWidth
                    variant="contained"
                    className="ms-test-codec-panel__run-btn"
                    disabled={loading || !codecCode.trim()}
                    startIcon={<PlayArrowIcon />}
                    onClick={() => {
                        // Drop the previous result before starting, so a run in flight
                        // never shows the last run's output as if it were this one's.
                        mutate(undefined);
                        runTest();
                    }}
                >
                    {getIntlText('common.label.run')}
                </Button>
                {!!testResult && (
                    <>
                        <Divider />
                        <Alert
                            severity={testResult.success ? 'success' : 'error'}
                            icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                        >
                            {testResult.success
                                ? getIntlText('setting.integration.custom_model_test_codec_success')
                                : testResult.error_message}
                        </Alert>
                        {testResult.success && (
                            <div className="ms-test-codec-panel__output">
                                <CodeEditor
                                    readOnly
                                    editable={false}
                                    editorLang="json"
                                    title={getIntlText('common.label.output')}
                                    value={JSON.stringify(testResult.output ?? {}, null, 2)}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default TestCodecPanel;
