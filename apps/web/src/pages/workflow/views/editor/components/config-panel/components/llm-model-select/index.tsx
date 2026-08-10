import React from 'react';
import { useRequest } from 'ahooks';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useI18n } from '@milesight/shared/src/hooks';
import { KeyboardArrowDownIcon } from '@milesight/shared/src/components';
import { llmAPI, awaitWrap, getResponseData, isRequestSuccess } from '@/services/http';

export interface LlmModelSelectProps {
    required?: boolean;
    value?: string;
    onChange?: (value: string) => void;
}

/**
 * Dropdown populated from the LLM Integration's currently configured models
 * (`llm-integration.integration.models`). Leaving the selection blank tells
 * the backend node to fall back to the first configured model.
 */
const LlmModelSelect: React.FC<LlmModelSelectProps> = ({ required, value, onChange }) => {
    const { getIntlText } = useI18n();

    const { data: models, loading } = useRequest(async () => {
        const [err, resp] = await awaitWrap(llmAPI.getModels());
        if (err || !isRequestSuccess(resp)) return [];
        return getResponseData(resp) || [];
    });

    return (
        <FormControl fullWidth size="small" sx={{ my: 1.5 }}>
            <InputLabel id="llm-model-select-label" required={required}>
                {getIntlText('workflow.editor.form_param_llm_model')}
            </InputLabel>
            <Select
                notched
                displayEmpty
                labelId="llm-model-select-label"
                required={required}
                label={getIntlText('workflow.editor.form_param_llm_model')}
                IconComponent={KeyboardArrowDownIcon}
                value={value || ''}
                onChange={e => onChange?.(e.target.value as string)}
            >
                <MenuItem value="">
                    <em>{getIntlText('workflow.editor.form_param_llm_model_default_option')}</em>
                </MenuItem>
                {!loading &&
                    (models || []).map(model => (
                        <MenuItem key={model} value={model}>
                            {model}
                        </MenuItem>
                    ))}
            </Select>
        </FormControl>
    );
};

export default LlmModelSelect;
