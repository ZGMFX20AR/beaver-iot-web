import { client, attachAPI, API_PREFIX } from './client';

/** gateway detail */
export interface GatewayDetailType {
    device_id: string;
    device_key: string;
    name: string;
    status: 'ONLINE' | 'OFFLINE';
    credential_id: string;
    device_count: number;
    application_id: string;
    eui: string;
}

/** synced device detail */
export interface SyncedDeviceType {
    id: string;
    ke?: string;
    eui: string;
    name: string;
    created_at: string;
}

/** syncAble device detail */
export type SyncAbleDeviceType = {
    eui: string;
    name: string;
    guess_model_id?: string;
};

/** mqtt credential detail */
export interface MqttCredentialResponse {
    credential_id?: string;
    username?: string;
    password?: string;
    client_id?: string;
    uplink_data_topic?: string;
    downlink_data_topic?: string;
    request_data_topic?: string;
    response_data_topic?: string;
}

/** mqtt broker detail */
export interface MqttBrokerInfo {
    host?: string;
    mqtt_port?: number;
    mqtts_port?: number;
    ws_ath?: string;
    ws_port?: number;
    wss_port?: number;
}

/** mqtt credential and broker detail */
export type MqttCredentialBrokerType = MqttCredentialResponse & MqttBrokerInfo;

/** mqtt check connect result */
export interface MqttConnectionValidateResponse {
    app_result: DeviceListAppItem[];
    profile_result: DeviceListProfileItem[];
}

/** mqtt check connect result  applications */
export interface DeviceListAppItem {
    app_name: string;
    application_id: string;
}

/** model select options */
export interface DeviceModelItem {
    label: string;
    value: string;
}

/** model response type */
type DeviceModelResponse = {
    [key: string]: string;
};

/** ProfileType */
interface DeviceListProfileItem {
    profile_id: string;
    profile_name: string;
    supports_join: boolean;
}

/** Value types a custom device model entity can hold */
export type CustomDeviceModelValueType = 'STRING' | 'LONG' | 'DOUBLE' | 'BOOLEAN';

/** LoRaWAN device class */
export type LoraClassType = 'ClassA' | 'ClassB' | 'ClassC';

/** One entity reported by a custom device model */
export interface CustomDeviceModelEntity {
    /** Key in the decoded payload; also the entity identifier */
    identifier: string;
    name?: string;
    value_type: CustomDeviceModelValueType;
    unit?: string;
}

/** A stored custom device model */
export interface CustomDeviceModelType {
    id: ApiKey;
    identifier: string;
    name: string;
    description?: string;
    /** Value to pass as the device model when adding a device */
    device_model_id: string;
    /** Generated template document */
    content?: string;
    /** Decomposed definition, so the editor can round-trip an existing model */
    lora_class?: LoraClassType;
    codec_code?: string;
    codec_entry?: string;
    codec_encode_entry?: string;
    entities?: CustomDeviceModelEntity[];
    created_at?: number;
    updated_at?: number;
}

/** Payload for creating/updating a custom device model */
export interface CustomDeviceModelPayload {
    name: string;
    description?: string;
    lora_class?: LoraClassType;
    codec_code: string;
    codec_entry?: string;
    codec_encode_entry?: string;
    entities: CustomDeviceModelEntity[];
}

export interface GatewayAPISchema extends APISchema {
    /** Get gateway list */
    getList: {
        request: void;
        response: {
            gateways: GatewayDetailType[];
        };
    };
    /** delete gateway */
    deleteGateWay: {
        request: {
            gateways: ApiKey[];
        };
        response: void;
    };

    /** add gateway */
    addGateway: {
        request: {
            name: string | undefined;
            eui: string | undefined;
            application_id: string;
            credential_id: string | undefined;
            client_id: string | undefined;
        };
        response: unknown;
    };

    /** get synced subDevice */
    getSyncedDevices: {
        request: {
            eui: string;
        };
        response: SyncedDeviceType[];
    };

    /** get sync able subsDevice */
    getSyncAbleDevices: {
        request: {
            eui: string;
        };
        response: SyncAbleDeviceType[];
    };

    /** sync devices */
    syncDevices: {
        request: {
            eui: string;
            devices: {
                eui: string;
                model_id: string;
                offline_timeout?: number;
            }[];
        };
        response: unknown;
    };

    /** get credential info */
    getCredential: {
        request: {
            eui: string;
            credential_id?: string;
        };
        response: MqttCredentialResponse;
    };
    /** get mqtt broke info */
    getMqttBrokerInfo: {
        request: void;
        response: MqttBrokerInfo;
    };
    /** check mqtt connection */
    checkMqttConnection: {
        request: {
            eui: string;
            credential_id?: string;
        };
        response: MqttConnectionValidateResponse;
    };
    validateGateway: {
        request: {
            eui: string;
        };
        response: void;
    };
    /** get device-model */
    getDeviceModels: {
        request: void;
        response: DeviceModelResponse;
    };

    /** list custom (non-blueprint) device models */
    getCustomDeviceModels: {
        request: void;
        response: CustomDeviceModelType[];
    };

    /** create a custom device model */
    addCustomDeviceModel: {
        request: CustomDeviceModelPayload;
        response: CustomDeviceModelType;
    };

    /** update a custom device model */
    updateCustomDeviceModel: {
        request: CustomDeviceModelPayload & { identifier: string };
        response: CustomDeviceModelType;
    };

    /** delete a custom device model */
    deleteCustomDeviceModel: {
        request: { identifier: string };
        response: void;
    };
}

/**
 * gateway related API services
 */
export default attachAPI<GatewayAPISchema>(client, {
    apis: {
        getList: `GET ${API_PREFIX}/milesight-gateway/gateways`,
        deleteGateWay: `POST ${API_PREFIX}/milesight-gateway/batch-delete-gateways`,
        addGateway: `POST ${API_PREFIX}/milesight-gateway/gateways`,
        async getSyncedDevices(params, options) {
            return client.request({
                method: 'GET',
                url: `${API_PREFIX}/milesight-gateway/gateways/${params.eui}/devices`,
                data: params,
                ...options,
            });
        },
        async getSyncAbleDevices(params, options) {
            return client.request({
                method: 'GET',
                url: `${API_PREFIX}/milesight-gateway/gateways/${params.eui}/sync-devices`,
                ...params,
                ...options,
            });
        },
        syncDevices: `POST ${API_PREFIX}/milesight-gateway/gateways/:eui/sync-devices`,
        getCredential: `POST ${API_PREFIX}/milesight-gateway/gateway-credential`,
        getMqttBrokerInfo: `GET ${API_PREFIX}/mqtt/broker-info`,
        checkMqttConnection: `POST ${API_PREFIX}/milesight-gateway/validate-connection`,
        validateGateway: `POST ${API_PREFIX}/milesight-gateway/validate-gateway-info`,
        getDeviceModels: `GET ${API_PREFIX}/milesight-gateway/device-models`,
        getCustomDeviceModels: `GET ${API_PREFIX}/milesight-gateway/custom-device-models`,
        addCustomDeviceModel: `POST ${API_PREFIX}/milesight-gateway/custom-device-models`,
        async updateCustomDeviceModel(params, options) {
            const { identifier, ...body } = params;
            return client.request({
                method: 'PUT',
                url: `${API_PREFIX}/milesight-gateway/custom-device-models/${identifier}`,
                data: body,
                ...options,
            });
        },
        async deleteCustomDeviceModel(params, options) {
            return client.request({
                method: 'DELETE',
                url: `${API_PREFIX}/milesight-gateway/custom-device-models/${params.identifier}`,
                ...options,
            });
        },
    },
});
