import { useRef, useEffect, useCallback } from 'react';
import cls from 'classnames';
import { IconButton, TextField, CircularProgress, Tooltip } from '@mui/material';
import { useI18n, useStoreShallow } from '@milesight/shared/src/hooks';
import {
    AutoAwesomeIcon,
    ArrowUpwardIcon,
    DeleteOutlineIcon,
} from '@milesight/shared/src/components';
import {
    aiAssistantAPI,
    awaitWrap,
    getResponseData,
    isRequestSuccess,
    type AiAssistantChatMessage,
} from '@/services/http';
import useAiAssistantStore, { type DisplayMessage } from './store';
import './style.less';

export interface AiAssistantChatPanelProps {
    /** Extra class applied to the panel root */
    className?: string;
    /** Rendered at the right edge of the header, next to the clear button */
    extraActions?: React.ReactNode;
}

const SUGGESTIONS = [
    'ai_assistant.suggestion_1',
    'ai_assistant.suggestion_2',
    'ai_assistant.suggestion_3',
];

/**
 * The assistant conversation UI.
 *
 * Presentation only — all state lives in the shared store, so this can be mounted
 * either as a full page or inside the floating widget without the thread resetting.
 */
const AiAssistantChatPanel: React.FC<AiAssistantChatPanelProps> = ({ className, extraActions }) => {
    const { getIntlText } = useI18n();
    const { messages, input, loading, setInput, setLoading, appendMessage, clear } =
        useAiAssistantStore(
            useStoreShallow([
                'messages',
                'input',
                'loading',
                'setInput',
                'setLoading',
                'appendMessage',
                'clear',
            ]),
        );
    const scrollRef = useRef<HTMLDivElement>(null);

    // Keep the latest message in view
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    const send = useCallback(
        async (text: string) => {
            const question = text.trim();
            // Read through the store rather than the closure: the panel can unmount and
            // remount (navigation, collapse) while a reply is still in flight.
            if (!question || useAiAssistantStore.getState().loading) return;

            appendMessage({ role: 'user', content: question });
            setInput('');
            setLoading(true);

            // Only role/content go to the backend; strip UI-only fields
            const history: AiAssistantChatMessage[] = useAiAssistantStore
                .getState()
                .messages.map(({ role, content }) => ({ role, content }));

            // $ignoreError: the global handler would raise a generic toast keyed off the error
            // code ("parameter validation failed"), which hides the point. The backend sends a
            // precise detail_message — which provider to use, which setting is missing — so show
            // that in the thread instead, where the question was asked.
            const [error, resp] = await awaitWrap(
                aiAssistantAPI.chat({ messages: history }, { $ignoreError: true }),
            );
            setLoading(false);

            if (error || !isRequestSuccess(resp)) {
                // A failed call arrives one of two ways: resolved carrying status "Failed", or
                // rejected by axios because the backend answered with a non-2xx status — most of
                // these are ErrorCode.PARAMETER_VALIDATION_FAILED, which maps to HTTP 400. The
                // envelope holding detail_message sits in a different place in each case, and
                // awaitWrap gives back [err, undefined] for the rejected one.
                const body = (resp?.data ?? error?.response?.data) as ApiResponse | undefined;
                appendMessage({
                    role: 'assistant',
                    // Generic copy only for transport failures, where there is no body at all
                    content:
                        body?.detail_message ||
                        body?.error_message ||
                        getIntlText('ai_assistant.error_reply'),
                    error: true,
                });
                return;
            }

            const data = getResponseData(resp);
            appendMessage({
                role: 'assistant',
                content: data?.reply || '',
                toolCalls: data?.toolCalls,
            });
        },
        [appendMessage, setInput, setLoading, getIntlText],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    return (
        <div className={cls('ms-ai-assistant', className)}>
            <div className="ms-ai-assistant__header">
                <div className="ms-ai-assistant__title">
                    <AutoAwesomeIcon />
                    <span>{getIntlText('ai_assistant.title')}</span>
                </div>
                <div className="ms-ai-assistant__actions">
                    {messages.length > 0 && (
                        <Tooltip title={getIntlText('ai_assistant.clear')}>
                            <IconButton onClick={clear} disabled={loading}>
                                <DeleteOutlineIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {extraActions}
                </div>
            </div>

            <div className="ms-ai-assistant__body" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="ms-ai-assistant__empty">
                        <AutoAwesomeIcon className="ms-ai-assistant__empty-icon" />
                        <div className="ms-ai-assistant__empty-title">
                            {getIntlText('ai_assistant.empty_title')}
                        </div>
                        <div className="ms-ai-assistant__empty-desc">
                            {getIntlText('ai_assistant.empty_desc')}
                        </div>
                        <div className="ms-ai-assistant__suggestions">
                            {SUGGESTIONS.map(key => {
                                const label = getIntlText(key);
                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        className="ms-ai-assistant__suggestion"
                                        onClick={() => send(label)}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    messages.map((msg: DisplayMessage, index: number) => (
                        <div
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            className={cls('ms-ai-assistant__msg', {
                                'ms-ai-assistant__msg--user': msg.role === 'user',
                                'ms-ai-assistant__msg--assistant': msg.role === 'assistant',
                                'ms-ai-assistant__msg--error': msg.error,
                            })}
                        >
                            <div className="ms-ai-assistant__bubble">
                                {msg.content}
                                {!!msg.toolCalls?.length && (
                                    <div className="ms-ai-assistant__tools">
                                        {getIntlText('ai_assistant.data_used')}:{' '}
                                        {msg.toolCalls
                                            .map(tc => tc.replace(/\(.*\)$/, ''))
                                            .join(' → ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="ms-ai-assistant__msg ms-ai-assistant__msg--assistant">
                        <div className="ms-ai-assistant__bubble ms-ai-assistant__bubble--loading">
                            <CircularProgress size={16} />
                            <span>{getIntlText('ai_assistant.thinking')}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="ms-ai-assistant__input">
                <TextField
                    fullWidth
                    multiline
                    maxRows={5}
                    value={input}
                    placeholder={getIntlText('ai_assistant.input_placeholder')}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                />
                <IconButton
                    className="ms-ai-assistant__send"
                    color="primary"
                    disabled={loading || !input.trim()}
                    onClick={() => send(input)}
                >
                    <ArrowUpwardIcon />
                </IconButton>
            </div>
        </div>
    );
};

export default AiAssistantChatPanel;
