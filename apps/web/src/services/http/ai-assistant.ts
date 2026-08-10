import { client, attachAPI, API_PREFIX } from './client';

export interface AiAssistantChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * AI Assistant (analysis chatbot) API.
 */
export interface AiAssistantAPISchema extends APISchema {
    /** Send the conversation so far and get the assistant's next reply */
    chat: {
        request: {
            messages: AiAssistantChatMessage[];
        };
        response: {
            reply: string;
            /** Trace of the data-lookup tools the assistant invoked, for transparency */
            toolCalls?: string[];
        };
    };
}

export default attachAPI<AiAssistantAPISchema>(client, {
    apis: {
        chat: `POST ${API_PREFIX}/ai-assistant/chat`,
    },
});
