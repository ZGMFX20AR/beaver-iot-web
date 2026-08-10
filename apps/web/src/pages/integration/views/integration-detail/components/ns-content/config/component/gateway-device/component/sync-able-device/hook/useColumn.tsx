import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Autocomplete, InputAdornment, TextField, Typography } from '@mui/material';
import { isEqual } from 'lodash-es';
import { useI18n } from '@milesight/shared/src/hooks';
import { type ColumnType } from '@/components';
import { DeviceModelItem, GatewayAPISchema } from '@/services/http/embedded-ns';

/** Offline timeout allowed range, minutes (matches the backend entity attribute) */
export const OFFLINE_TIMEOUT_MIN = 1;
export const OFFLINE_TIMEOUT_MAX = 2880;
export const OFFLINE_TIMEOUT_DEFAULT = 1500;

export type TableRowDataType = ObjectToCamelCase<
    GatewayAPISchema['getSyncAbleDevices']['response'][0]
>;

export interface UseColumnsProps<T> {
    modelOptions: DeviceModelItem[];
    selectedIds: readonly ApiKey[];
    modelMap: Map<string, string>;
    setModelMap: Dispatch<SetStateAction<Map<string, string>>>;
    offlineTimeoutMap: Map<string, string>;
    setOfflineTimeoutMap: Dispatch<SetStateAction<Map<string, string>>>;
}

/** Whether a raw offline-timeout input string is valid (empty is allowed - backend defaults it) */
export const isOfflineTimeoutValid = (raw?: string) => {
    if (!raw) return true;
    if (!/^\d+$/.test(raw)) return false;
    const num = Number(raw);
    return num >= OFFLINE_TIMEOUT_MIN && num <= OFFLINE_TIMEOUT_MAX;
};

const useColumns = <T extends TableRowDataType>({
    modelOptions,
    selectedIds,
    modelMap,
    setModelMap,
    offlineTimeoutMap,
    setOfflineTimeoutMap,
}: UseColumnsProps<T>) => {
    const { getIntlText } = useI18n();
    const [inputValue, setInputValue] = useState('');

    const handleChangeModel = (eui: string, model: string) => {
        modelMap.set(eui, model);
        setModelMap(modelMap);
    };

    const handleChangeOfflineTimeout = (eui: string, value: string) => {
        offlineTimeoutMap.set(eui, value);
        setOfflineTimeoutMap(new Map(offlineTimeoutMap));
    };

    const columns: ColumnType<T>[] = useMemo(() => {
        return [
            {
                field: 'name',
                headerName: getIntlText('device.label.param_device_name'),
                flex: 1.1,
                minWidth: 200,
                ellipsis: true,
            },
            {
                field: 'eui',
                headerName: getIntlText('setting.integration.label.device_eui'),
                flex: 1,
                minWidth: 180,
                ellipsis: true,
                renderCell({ value }) {
                    return value;
                },
            },
            {
                field: 'guessModelId',
                headerName: getIntlText('setting.integration.label.model'),
                flex: 1,
                minWidth: 300,
                align: 'left',
                headerAlign: 'left',
                renderCell({ row, value }) {
                    const innerValue = modelOptions.find(
                        item => item.value === modelMap?.get(row.eui),
                    );
                    return (
                        <Autocomplete
                            options={modelOptions}
                            isOptionEqualToValue={(option, value) => isEqual(option, value)}
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label=""
                                    error={selectedIds.includes(row.eui) && !modelMap.get(row.eui)}
                                    helperText={null}
                                    placeholder={getIntlText('common.label.please_select')}
                                    InputProps={{
                                        ...params.InputProps,
                                        size: 'medium',
                                    }}
                                />
                            )}
                            getOptionKey={option => option.value}
                            value={innerValue || null}
                            onChange={(_, option: any) => {
                                handleChangeModel(row.eui, option?.value);
                            }}
                            // resolve label jitter when switching options
                            onInputChange={(event, label: string) => {
                                setInputValue(label);
                            }}
                        />
                    );
                },
            },
            {
                field: 'offlineTimeout',
                headerName: getIntlText('setting.integration.label_device_offline_timeout'),
                flex: 1,
                minWidth: 200,
                align: 'left',
                headerAlign: 'left',
                renderCell({ row }) {
                    const rawValue = offlineTimeoutMap.get(row.eui) ?? '';
                    const valid = isOfflineTimeoutValid(rawValue);

                    return (
                        <TextField
                            fullWidth
                            type="text"
                            placeholder={String(OFFLINE_TIMEOUT_DEFAULT)}
                            error={!valid}
                            helperText={null}
                            value={rawValue}
                            onChange={event => {
                                handleChangeOfflineTimeout(row.eui, event.target.value.trim());
                            }}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Typography sx={{ fontSize: 14 }}>
                                                {getIntlText('common.unit.minute_short')}
                                            </Typography>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    );
                },
            },
        ];
    }, [getIntlText, modelOptions, selectedIds, modelMap, offlineTimeoutMap]);

    return columns;
};

export default useColumns;
