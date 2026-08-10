import { client, attachAPI, API_PREFIX } from './client';

/** connection preview returned by the "test connection" pre-flight check */
export interface ValidateConnectionResponse {
    device_name?: string;
    di_count: number;
    do_count: number;
    ai_count: number;
    poll_job_count: number;
    write_job_count: number;
}

export interface IrivIocAPISchema extends APISchema {
    /** log in to the gateway and read its config, without creating a device or changing its settings */
    validateConnection: {
        request: {
            host: string;
            username: string;
            password: string;
        };
        response: ValidateConnectionResponse;
    };
}

/**
 * IRIV-IOC MQTT Gateway related API services
 */
export default attachAPI<IrivIocAPISchema>(client, {
    apis: {
        validateConnection: `POST ${API_PREFIX}/iriv-ioc-mqtt-gateway/validate-connection`,
    },
});
