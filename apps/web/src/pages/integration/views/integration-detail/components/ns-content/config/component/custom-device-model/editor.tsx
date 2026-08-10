import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Tooltip as MuiTooltip,
} from '@mui/material';

import { useI18n } from '@milesight/shared/src/hooks';
import { Modal, toast, AddIcon, DeleteOutlineIcon } from '@milesight/shared/src/components';
import { CodeEditor } from '@/components';
import {
    awaitWrap,
    isRequestSuccess,
    embeddedNSApi,
    type CustomDeviceModelType,
    type CustomDeviceModelEntity,
    type CustomDeviceModelValueType,
    type LoraClassType,
} from '@/services/http';

import './style.less';

/** Value types offered for an entity */
const VALUE_TYPES: CustomDeviceModelValueType[] = ['DOUBLE', 'LONG', 'STRING', 'BOOLEAN'];

/** LoRaWAN device classes */
const LORA_CLASSES: LoraClassType[] = ['ClassA', 'ClassB', 'ClassC'];

const DEFAULT_CODEC_ENTRY = 'decodeUplink';

/** A blank entity row */
const emptyEntity = (): CustomDeviceModelEntity => ({
    identifier: '',
    name: '',
    value_type: 'DOUBLE',
    unit: '',
});

interface IProps {
    /** Model being edited; omit to create a new one */
    model?: CustomDeviceModelType | null;
    onCancel: () => void;
    onSuccess: () => void;
}

/**
 * Create or edit a custom (non-blueprint) LoRaWAN device model.
 *
 * The entity rows describe what the device reports, and the decoder turns its binary
 * uplink into the JSON those entities are read from - so an entity identifier must match
 * the key the decoder returns.
 */
const CustomDeviceModelEditor: React.FC<IProps> = ({ model, onCancel, onSuccess }) => {
    const { getIntlText } = useI18n();
    const isEdit = !!model;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loraClass, setLoraClass] = useState<LoraClassType>('ClassA');
    const [codecEntry, setCodecEntry] = useState(DEFAULT_CODEC_ENTRY);
    const [codecCode, setCodecCode] = useState('');
    const [entities, setEntities] = useState<CustomDeviceModelEntity[]>([emptyEntity()]);
    const [submitting, setSubmitting] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    /**
     * Hydrate the form when editing. The server decomposes the stored template back into
     * these fields, so an existing definition round-trips instead of being retyped.
     */
    useEffect(() => {
        if (!model) return;

        setName(model.name || '');
        setDescription(model.description || '');
        setLoraClass(model.lora_class || 'ClassA');
        setCodecEntry(model.codec_entry || DEFAULT_CODEC_ENTRY);
        setCodecCode(model.codec_code || '');
        setEntities(model.entities?.length ? model.entities : [emptyEntity()]);
    }, [model]);

    const updateEntity = useCallback(
        (index: number, patch: Partial<CustomDeviceModelEntity>) => {
            setEntities(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
        },
        [],
    );

    const addEntity = useCallback(() => {
        setEntities(prev => [...prev, emptyEntity()]);
    }, []);

    const removeEntity = useCallback((index: number) => {
        setEntities(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    }, []);

    /** Rows that are filled in enough to submit */
    const validEntities = useMemo(
        () => entities.filter(entity => !!entity.identifier?.trim()),
        [entities],
    );

    const duplicateIdentifiers = useMemo(() => {
        const seen = new Set<string>();
        const duplicates = new Set<string>();
        validEntities.forEach(entity => {
            const key = entity.identifier.trim();
            if (seen.has(key)) duplicates.add(key);
            seen.add(key);
        });
        return duplicates;
    }, [validEntities]);

    const errorMessage = useMemo(() => {
        if (!name.trim()) return getIntlText('setting.integration.custom_model_name_required');
        if (!codecCode.trim()) return getIntlText('setting.integration.custom_model_codec_required');
        if (!validEntities.length) {
            return getIntlText('setting.integration.custom_model_entity_required');
        }
        if (duplicateIdentifiers.size) {
            return getIntlText('setting.integration.custom_model_entity_duplicated');
        }
        return null;
    }, [name, codecCode, validEntities, duplicateIdentifiers, getIntlText]);

    const handleSubmit = useCallback(async () => {
        setShowErrors(true);
        if (errorMessage) return;

        const payload = {
            name: name.trim(),
            description: description.trim() || undefined,
            lora_class: loraClass,
            codec_code: codecCode,
            codec_entry: codecEntry.trim() || DEFAULT_CODEC_ENTRY,
            entities: validEntities.map(entity => ({
                identifier: entity.identifier.trim(),
                name: entity.name?.trim() || entity.identifier.trim(),
                value_type: entity.value_type,
                unit: entity.unit?.trim() || undefined,
            })),
        };

        setSubmitting(true);
        const [error, resp] = await awaitWrap(
            isEdit
                ? embeddedNSApi.updateCustomDeviceModel({
                      ...payload,
                      identifier: model!.identifier,
                  })
                : embeddedNSApi.addCustomDeviceModel(payload),
        );
        setSubmitting(false);

        if (error || !isRequestSuccess(resp)) return;

        toast.success(getIntlText('common.message.operation_success'));
        onSuccess();
    }, [
        errorMessage,
        name,
        description,
        loraClass,
        codecCode,
        codecEntry,
        validEntities,
        isEdit,
        model,
        onSuccess,
        getIntlText,
    ]);

    return (
        <Modal
            visible
            size="lg"
            width="900px"
            title={
                isEdit
                    ? getIntlText('setting.integration.custom_model_edit_title')
                    : getIntlText('setting.integration.custom_model_add_title')
            }
            onCancel={onCancel}
            onOk={handleSubmit}
            okButtonProps={{ loading: submitting }}
        >
            <div className="ms-custom-device-model-editor">
                <Alert severity="info" sx={{ mb: 2 }}>
                    {getIntlText('setting.integration.custom_model_tip')}
                </Alert>

                <Stack direction="row" spacing="12px">
                    <TextField
                        required
                        fullWidth
                        label={getIntlText('setting.integration.custom_model_name')}
                        value={name}
                        disabled={isEdit}
                        error={showErrors && !name.trim()}
                        onChange={e => setName(e.target.value)}
                    />
                    <TextField
                        select
                        fullWidth
                        label={getIntlText('setting.integration.custom_model_lora_class')}
                        value={loraClass}
                        onChange={e => setLoraClass(e.target.value as LoraClassType)}
                    >
                        {LORA_CLASSES.map(item => (
                            <MenuItem key={item} value={item}>
                                {item}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>

                <TextField
                    fullWidth
                    label={getIntlText('common.label.description')}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />

                <div className="ms-custom-device-model-editor__section-title">
                    {getIntlText('setting.integration.custom_model_entities')}
                </div>

                {entities.map((entity, index) => (
                    // Rows are positional and may be empty, so the index is the stable key here.
                    // eslint-disable-next-line react/no-array-index-key
                    <Stack key={index} direction="row" spacing="8px" sx={{ mb: 1 }}>
                        <TextField
                            fullWidth
                            label={getIntlText('setting.integration.custom_model_entity_key')}
                            placeholder="temperature"
                            value={entity.identifier}
                            error={
                                showErrors && duplicateIdentifiers.has(entity.identifier.trim())
                            }
                            onChange={e => updateEntity(index, { identifier: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label={getIntlText('common.label.name')}
                            value={entity.name}
                            onChange={e => updateEntity(index, { name: e.target.value })}
                        />
                        <TextField
                            select
                            fullWidth
                            label={getIntlText('common.label.type')}
                            value={entity.value_type}
                            onChange={e =>
                                updateEntity(index, {
                                    value_type: e.target.value as CustomDeviceModelValueType,
                                })
                            }
                        >
                            {VALUE_TYPES.map(item => (
                                <MenuItem key={item} value={item}>
                                    {item}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            label={getIntlText('setting.integration.custom_model_entity_unit')}
                            value={entity.unit}
                            onChange={e => updateEntity(index, { unit: e.target.value })}
                        />
                        <MuiTooltip title={getIntlText('common.label.delete')}>
                            <span>
                                <IconButton
                                    disabled={entities.length <= 1}
                                    onClick={() => removeEntity(index)}
                                >
                                    <DeleteOutlineIcon />
                                </IconButton>
                            </span>
                        </MuiTooltip>
                    </Stack>
                ))}

                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    sx={{ textTransform: 'none', mb: 2 }}
                    onClick={addEntity}
                >
                    {getIntlText('setting.integration.custom_model_add_entity')}
                </Button>

                <div className="ms-custom-device-model-editor__section-title">
                    {getIntlText('setting.integration.custom_model_decoder')}
                </div>

                <TextField
                    fullWidth
                    label={getIntlText('setting.integration.custom_model_codec_entry')}
                    helperText={getIntlText('setting.integration.custom_model_codec_entry_help')}
                    value={codecEntry}
                    onChange={e => setCodecEntry(e.target.value)}
                />

                <div className="ms-custom-device-model-editor__code">
                    <CodeEditor
                        editorLang="js"
                        renderHeader={() => null}
                        value={codecCode}
                        onChange={setCodecCode}
                    />
                </div>

                {showErrors && !!errorMessage && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {errorMessage}
                    </Alert>
                )}
            </div>
        </Modal>
    );
};

export default CustomDeviceModelEditor;
