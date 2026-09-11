import { client, attachAPI, API_PREFIX } from './client';

/** An EdgeAI box whose camera pipelines can be relayed */
export interface CameraSourceType {
    id: ApiKey;
    name: string;
    /** Host or host:port of the box, without a scheme */
    host: string;
    /**
     * Whether a key is on file. The key itself is never returned - it is write-only, so
     * the UI can say a source is configured without being able to reveal it.
     */
    has_api_key: boolean;
    /** Path to point an image widget at, with `{pipelineId}` left to fill in */
    stream_path_template: string;
}

export interface CameraSourcePayload {
    name: string;
    host: string;
    /** Leave blank when editing to keep the key already stored */
    api_key?: string;
}

const INTEGRATION_PREFIX = `${API_PREFIX}/edgeai-stream`;

export interface EdgeAiStreamAPISchema extends APISchema {
    /** List configured camera sources */
    getSources: {
        request: void;
        response: CameraSourceType[];
    };

    /** Add a camera source */
    addSource: {
        request: CameraSourcePayload;
        response: CameraSourceType;
    };

    /** Update a camera source */
    updateSource: {
        request: CameraSourcePayload & { id: ApiKey };
        response: CameraSourceType;
    };

    /** Remove a camera source and its stored key */
    deleteSource: {
        request: { id: ApiKey };
        response: void;
    };
}

/**
 * Camera sources for the EdgeAI stream relay.
 *
 * Note these are the *management* endpoints and require authentication as usual. The
 * relay itself (`/edgeai-stream/streams/...`) is deliberately unauthenticated and is not
 * called from here - it goes straight into an `<img>` tag, which cannot send a token.
 */
export default attachAPI<EdgeAiStreamAPISchema>(client, {
    apis: {
        getSources: `GET ${INTEGRATION_PREFIX}/sources`,
        addSource: `POST ${INTEGRATION_PREFIX}/sources`,
        async updateSource(params, options) {
            const { id, ...body } = params;
            return client.request({
                method: 'PUT',
                url: `${INTEGRATION_PREFIX}/sources/${id}`,
                data: body,
                ...options,
            });
        },
        async deleteSource(params, options) {
            return client.request({
                method: 'DELETE',
                url: `${INTEGRATION_PREFIX}/sources/${params.id}`,
                ...options,
            });
        },
    },
});
