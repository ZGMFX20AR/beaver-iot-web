import { CircularProgress } from '@mui/material';
import {
    SettingsEthernetIcon,
    EntityIcon,
    RoomServiceIcon,
    EmailIcon,
    WebhookIcon,
    TimerIcon,
    HearingIcon,
    InputIcon,
    CallSplitIcon,
    FactCheckIcon,
    CheckCircleIcon,
    ErrorIcon,
    OutputIcon,
    HttpIcon,
    MqttIcon,
    HistoryIcon,
    AutoAwesomeIcon,
    WarningAmberIcon,
    // FlagIcon,
} from '@milesight/shared/src/components';

type NodeCategoryConfigItemType = {
    /** Node Category i18n key */
    labelIntlKey: string;
};

/**
 * Node category configs
 */
export const nodeCategoryConfigs: Record<WorkflowNodeCategoryType, NodeCategoryConfigItemType> = {
    entry: {
        labelIntlKey: 'workflow.label.node_category_entry',
    },
    control: {
        labelIntlKey: 'workflow.label.node_category_control',
    },
    action: {
        labelIntlKey: 'workflow.label.node_category_action',
    },
    external: {
        labelIntlKey: 'workflow.label.node_category_external',
    },
};

/**
 * Node param type
 *
 * Attention: The param type only used in the front-end to match different data generation methods
 *
 * @template static - The static param will always exist when the node is in workflow
 * @template url - The url param will be passed to the downstream node when the url is
 * entered, the format is: `string`
 * @template object - It is a dynamic param, and the value will be passed to the
 * downstream node when the data is not empty, the format is:
 * `Record<string, string>`
 * @template objectArray - It is a dynamic param, and the value will be passed to the
 * downstream node, the format is:
 * `{ identify?: string; name: string; type: string }[]`
 * @template entities - The entity param will be passed to the downstream node when the
 * entity is selected, the format is: `string[]`
 * @template objectEntities - The entity param will be passed to the downstream node when
 * the entity is selected, the format is:
 * `{ [entityKey: string]: string }`
 */
export type NodeParamValueType =
    | 'static'
    | 'url'
    | 'object'
    | 'objectArray'
    | 'entities'
    | 'objectEntities';

/**
 * Node config item type
 */
export type NodeConfigItemType = {
    /**
     * Node Type
     */
    type: WorkflowNodeType;
    /**
     * Backend component name
     */
    componentName: string;
    /**
     * Label i18n key
     */
    labelIntlKey: string;
    /**
     * Description i18n key
     */
    descIntlKey?: string;
    /**
     * Node Icon
     */
    icon: React.ReactNode;
    /**
     * Node Icon background color
     */
    iconBgColor: string;
    /**
     * Node Category
     */
    category: WorkflowNodeCategoryType;
    /**
     * Enable independent testing
     */
    testable?: boolean;
    /**
     * The keys that can be used in test input
     * @deprecated Use `testInputs` instead
     */
    testInputKeys?: {
        key: string;
        type: 'object' | 'array' | 'string';
    }[];

    /**
     * The params definition that can be used in single node test
     */
    testInputs?: {
        /** Test input param key */
        key: string;
        /** Param path in parameters */
        path?: string | string[];
        /** Test param value type */
        type: 'string' | 'array' | 'object';
        /** Pre-defined simulated data */
        mocks?: any[];
    }[];
    /**
     * The keys that can be referenced in downstream node
     * @deprecated Use `outputs` instead
     */
    outputKeys?: string[];

    /**
     * The output params definition
     */
    outputs?: {
        /** Output param key */
        key: string;
        /** Output param type */
        type: NodeParamValueType;
        /** Output param value type */
        // valueType?: 'string' | 'long' | 'number' | 'boolean' | 'array' | 'object';
        valueType?: EntityValueDataType;
        /** Output param path in parameters */
        path?: string | string[];
        /** Custom output param label */
        label?: string;
        /**
         * Output param testable
         *
         * @description If `false`, the param will not be displayed in the workflow test input
         */
        testable?: boolean;
        /** I18n key for param description */
        descIntlKey?: string;
    }[];
    /**
     * Whether the node is loaded from remote
     */
    isRemote?: boolean;
};

/**
 * Basic node configs
 */
export const basicNodeConfigs: Record<WorkflowNodeType, NodeConfigItemType> = {
    timer: {
        type: 'timer',
        componentName: 'simpleTimer',
        labelIntlKey: 'workflow.label.timer_node_name',
        descIntlKey: 'workflow.label.timer_node_desc',
        icon: <TimerIcon />,
        iconBgColor: '#3491FA',
        category: 'entry',
    },
    trigger: {
        type: 'trigger',
        componentName: 'trigger',
        labelIntlKey: 'workflow.label.trigger_node_name',
        descIntlKey: 'workflow.label.trigger_node_desc',
        icon: <InputIcon />,
        iconBgColor: '#3491FA',
        category: 'entry',
        // testInputKeys: [
        //     {
        //         key: 'entityConfigs',
        //         type: 'array',
        //     },
        // ],
        outputs: [
            {
                key: 'entityConfigs',
                type: 'objectArray',
            },
        ],
    },
    listener: {
        type: 'listener',
        componentName: 'eventListener',
        labelIntlKey: 'workflow.label.listener_node_name',
        descIntlKey: 'workflow.label.listener_node_desc',
        icon: <HearingIcon />,
        iconBgColor: '#3491FA',
        category: 'entry',
        outputs: [
            {
                key: 'entities',
                type: 'entities',
            },
            {
                key: 'entityData.keys',
                type: 'entities',
            },
        ],
    },
    mqtt: {
        type: 'mqtt',
        componentName: 'simpleMqtt',
        labelIntlKey: 'workflow.label.mqtt_node_name',
        descIntlKey: 'workflow.label.mqtt_node_desc',
        icon: <MqttIcon />,
        iconBgColor: '#3491FA',
        category: 'entry',
        // isRemote: true,
        outputs: [
            {
                key: 'topic',
                label: 'Topic',
                type: 'static',
                valueType: 'STRING',
                testable: false,
                descIntlKey: 'workflow.editor.output_desc_mqtt_topic',
            },
            {
                key: 'payload',
                label: 'Payload',
                type: 'static',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_mqtt_payload',
            },
        ],
    },
    httpin: {
        type: 'httpin',
        componentName: 'httpIn',
        labelIntlKey: 'workflow.label.http_in_node_name',
        descIntlKey: 'workflow.label.httpin_node_desc',
        icon: <HttpIcon />,
        iconBgColor: '#3491FA',
        category: 'entry',
        outputs: [
            {
                key: 'header',
                type: 'static',
                label: 'Header',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_request_header',
            },
            {
                key: 'body',
                type: 'static',
                label: 'Body',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_request_body',
            },
            {
                key: 'pathParam',
                path: 'url',
                type: 'url',
                label: 'URL',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_variables_in_path',
            },
            {
                key: 'params',
                type: 'static',
                label: 'Params',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_request_params',
            },
        ],
    },
    ifelse: {
        type: 'ifelse',
        componentName: 'choice',
        labelIntlKey: 'workflow.label.ifelse_node_name',
        icon: <CallSplitIcon sx={{ transform: 'rotate(90deg)' }} />,
        iconBgColor: '#F57C00',
        category: 'control',
    },
    // end: {
    //     type: 'end',
    //     labelIntlKey: 'workflow.label.end_node_name',
    //     icon: <FlagIcon />,
    //     iconBgColor: '#F57C00',
    //     category: 'control',
    // },
    code: {
        type: 'code',
        componentName: 'code',
        labelIntlKey: 'workflow.label.code_node_name',
        icon: <SettingsEthernetIcon />,
        iconBgColor: '#26A69A',
        category: 'action',
        outputs: [
            {
                key: 'payload',
                type: 'objectArray',
            },
        ],
        testInputs: [
            {
                key: 'inputArguments',
                type: 'object',
            },
        ],
    },
    assigner: {
        type: 'assigner',
        componentName: 'entityAssigner',
        labelIntlKey: 'workflow.label.assigner_node_name',
        icon: <EntityIcon />,
        iconBgColor: '#26A69A',
        category: 'action',
        outputs: [
            {
                key: 'exchangePayload',
                type: 'objectEntities',
            },
        ],
    },
    service: {
        type: 'service',
        componentName: 'serviceInvocation',
        labelIntlKey: 'workflow.label.service_node_name',
        icon: <RoomServiceIcon />,
        iconBgColor: '#26A69A',
        category: 'action',
        outputs: [
            {
                key: 'payload',
                type: 'objectArray',
            },
        ],
    },
    select: {
        type: 'select',
        componentName: 'entitySelector',
        labelIntlKey: 'workflow.label.select_node_name',
        icon: <FactCheckIcon />,
        iconBgColor: '#26A69A',
        category: 'action',
        outputs: [
            {
                key: 'entities',
                type: 'entities',
            },
            {
                key: 'entityData.keys',
                type: 'entities',
            },
        ],
    },
    llmCompletion: {
        type: 'llmCompletion',
        componentName: 'llmCompletion',
        labelIntlKey: 'workflow.label.llm_completion_node_name',
        icon: <AutoAwesomeIcon />,
        iconBgColor: '#7B61FF',
        category: 'action',
        // The node always emits a single fixed `completion` key, so declare it statically
        // rather than deriving it from user-editable parameters.
        outputs: [
            {
                key: 'completion',
                label: 'Completion',
                type: 'static',
                valueType: 'STRING',
            },
        ],
    },
    anomalyDetection: {
        type: 'anomalyDetection',
        componentName: 'anomalyDetection',
        labelIntlKey: 'workflow.label.anomaly_detection_node_name',
        icon: <WarningAmberIcon />,
        iconBgColor: '#FF9800',
        category: 'action',
        // Fixed output keys computed by the node, declared statically so the variable
        // picker offers them (branch on `hasAnomaly`, narrate `summary`).
        outputs: [
            {
                key: 'hasAnomaly',
                label: 'Has Anomaly',
                type: 'static',
                valueType: 'BOOLEAN',
            },
            {
                key: 'anomalyCount',
                label: 'Anomaly Count',
                type: 'static',
                valueType: 'LONG',
            },
            {
                key: 'summary',
                label: 'Summary',
                type: 'static',
                valueType: 'STRING',
            },
        ],
    },
    entityHistory: {
        type: 'entityHistory',
        componentName: 'entityHistory',
        labelIntlKey: 'workflow.label.entity_history_node_name',
        icon: <HistoryIcon />,
        iconBgColor: '#7E57C2',
        category: 'action',
        // Same shape as the `select` node: `parameters.entities` is a string[] of entity
        // keys, and the node outputs one aggregated value per key, so the variable picker
        // expands them the same way.
        outputs: [
            {
                key: 'entities',
                type: 'entities',
            },
        ],
    },
    email: {
        type: 'email',
        componentName: 'email',
        labelIntlKey: 'workflow.label.email_node_name',
        icon: <EmailIcon />,
        iconBgColor: '#7E57C2',
        category: 'external',
        testInputs: [
            {
                key: 'content',
                type: 'string',
            },
        ],
    },
    webhook: {
        type: 'webhook',
        componentName: 'webhook',
        labelIntlKey: 'workflow.label.webhook_node_name',
        icon: <WebhookIcon />,
        iconBgColor: '#7E57C2',
        category: 'external',
        testInputs: [
            {
                key: 'inputArguments',
                type: 'object',
            },
        ],
    },
    http: {
        type: 'http',
        componentName: 'httpRequest',
        labelIntlKey: 'workflow.label.http_node_name',
        icon: <HttpIcon />,
        iconBgColor: '#7E57C2',
        category: 'external',
        outputs: [
            {
                key: 'responseHeaders',
                label: 'Header',
                type: 'static',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_response_header',
            },
            {
                key: 'responseBody',
                label: 'Body',
                type: 'static',
                valueType: 'STRING',
                descIntlKey: 'workflow.editor.output_desc_response_body',
            },
            {
                key: 'statusCode',
                label: 'Status Code',
                type: 'static',
                valueType: 'LONG',
                descIntlKey: 'workflow.editor.output_desc_response_code',
            },
        ],
        testInputs: [
            {
                key: 'header',
                type: 'object',
            },
            {
                key: 'params',
                type: 'object',
            },
            {
                key: 'body',
                type: 'object',
            },
        ],
    },
    output: {
        type: 'output',
        componentName: 'output',
        labelIntlKey: 'workflow.label.output_node_name',
        icon: <OutputIcon />,
        iconBgColor: '#7E57C2',
        category: 'external',
        testInputs: [
            {
                key: 'outputVariables',
                type: 'object',
            },
        ],
    },
};

/**
 * Status Render Map
 */
export const LogStatusMap: Record<
    WorkflowNodeStatus | 'LOADING',
    { className: string; icon: React.ReactNode }
> = {
    SUCCESS: {
        className: 'ms-log-status__success',
        icon: <CheckCircleIcon />,
    },
    ERROR: {
        className: 'ms-log-status__error',
        icon: <ErrorIcon />,
    },
    LOADING: {
        className: 'ms-log-status__loading',
        icon: <CircularProgress size={16} />,
    },
};
