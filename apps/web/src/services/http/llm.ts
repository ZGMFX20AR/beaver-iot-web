import { client, attachAPI, API_PREFIX } from './client';

/**
 * llm integration API services
 */
export interface LlmAPISchema extends APISchema {
    /** Get the list of models currently available to the LLM Integration */
    getModels: {
        request: void;
        response: string[];
    };
}

export default attachAPI<LlmAPISchema>(client, {
    apis: {
        getModels: `GET ${API_PREFIX}/llm-integration/models`,
    },
});
