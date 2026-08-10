import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { AiAssistantChatMessage } from '@/services/http';

export type DisplayMessage = AiAssistantChatMessage & {
    /** Tool lookups the assistant made for this reply, shown as a transparency trace */
    toolCalls?: string[];
    /** True when the reply is an error rather than a normal answer */
    error?: boolean;
};

interface AiAssistantStore {
    /**
     * Whether the floating chat panel is expanded
     */
    open: boolean;

    /**
     * The conversation so far. Kept in the store rather than in the panel so the
     * thread survives navigation between pages and collapsing the widget.
     */
    messages: DisplayMessage[];

    /**
     * Draft question, preserved across collapse/expand
     */
    input: string;

    /**
     * Whether a reply is in flight
     */
    loading: boolean;

    setOpen: (open: boolean) => void;

    toggle: () => void;

    setInput: (input: string) => void;

    setLoading: (loading: boolean) => void;

    appendMessage: (message: DisplayMessage) => void;

    clear: () => void;
}

const useAiAssistantStore = create(
    immer<AiAssistantStore>(set => ({
        open: false,
        messages: [],
        input: '',
        loading: false,

        setOpen: open =>
            set(state => {
                state.open = open;
            }),

        toggle: () =>
            set(state => {
                state.open = !state.open;
            }),

        setInput: input =>
            set(state => {
                state.input = input;
            }),

        setLoading: loading =>
            set(state => {
                state.loading = loading;
            }),

        appendMessage: message =>
            set(state => {
                state.messages.push(message);
            }),

        clear: () =>
            set(state => {
                state.messages = [];
            }),
    })),
);

export default useAiAssistantStore;
