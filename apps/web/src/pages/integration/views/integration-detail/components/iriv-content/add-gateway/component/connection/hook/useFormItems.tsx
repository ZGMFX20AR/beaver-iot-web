import { useMemo } from 'react';
import { type ControllerProps, type FieldValues } from 'react-hook-form';
import { TextFieldProps } from '@mui/material';
import CopyTextField from '@/components/copy-text';
import { checkRequired, checkMaxLength } from '@milesight/shared/src/utils/validators';

export interface ConnectionFormType {
    name: string;
    host: string;
    username: string;
    password: string;
}

type ExtendControllerProps<T extends FieldValues> = ControllerProps<T> & {
    shouldRender?: (data: Partial<T>) => boolean;
};

/** step 1 of the Add Gateway wizard: gateway name + how to reach/log into it */
const useFormItems = () => {
    const formItems = useMemo(() => {
        const props: Partial<TextFieldProps> = {
            fullWidth: true,
            type: 'text',
            size: 'small',
            margin: 'dense',
            sx: { my: 1.5 },
        };
        const result: ExtendControllerProps<ConnectionFormType>[] = [];

        result.push(
            {
                name: 'name',
                rules: {
                    validate: {
                        checkRequired: checkRequired(),
                        checkMaxLength: checkMaxLength({ max: 127 }),
                    },
                },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <CopyTextField
                            {...props}
                            required
                            label="Gateway Name"
                            error={!!error}
                            helperText={error ? error.message : null}
                            value={value}
                            onChange={onChange}
                        />
                    );
                },
            },
            {
                name: 'host',
                rules: {
                    validate: {
                        checkRequired: checkRequired(),
                        checkMaxLength: checkMaxLength({ max: 253 }),
                    },
                },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <CopyTextField
                            {...props}
                            required
                            label="Gateway IP / Host"
                            placeholder="e.g. 192.168.1.64"
                            error={!!error}
                            helperText={error ? error.message : null}
                            value={value}
                            onChange={onChange}
                        />
                    );
                },
            },
            {
                name: 'username',
                rules: {
                    validate: {
                        checkRequired: checkRequired(),
                        checkMaxLength: checkMaxLength({ max: 64 }),
                    },
                },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <CopyTextField
                            {...props}
                            required
                            label="Admin Username"
                            error={!!error}
                            helperText={error ? error.message : null}
                            value={value}
                            onChange={onChange}
                        />
                    );
                },
            },
            {
                name: 'password',
                rules: {
                    validate: {
                        checkRequired: checkRequired(),
                        checkMaxLength: checkMaxLength({ max: 128 }),
                    },
                },
                render({ field: { onChange, value }, fieldState: { error } }) {
                    return (
                        <CopyTextField
                            {...props}
                            type="password"
                            required
                            label="Admin Password"
                            error={!!error}
                            helperText={error ? error.message : null}
                            value={value}
                            onChange={onChange}
                        />
                    );
                },
            },
        );

        return result;
    }, []);

    return formItems;
};

export default useFormItems;
