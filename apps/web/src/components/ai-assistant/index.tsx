import { useEffect } from 'react';
import { Fab, IconButton, Tooltip } from '@mui/material';
import { useI18n, useStoreShallow } from '@milesight/shared/src/hooks';
import { AutoAwesomeIcon, CloseIcon } from '@milesight/shared/src/components';
import AiAssistantChatPanel from './chat-panel';
import useAiAssistantStore from './store';
import './style.less';

/**
 * Floating AI assistant.
 *
 * Renders a launcher pinned to the bottom-right of the viewport that expands into the
 * chat panel. Mounted by the layout on data pages only — see BasicLayout.
 */
const FloatingAiAssistant: React.FC = () => {
    const { getIntlText } = useI18n();
    const { open, setOpen, toggle } = useAiAssistantStore(
        useStoreShallow(['open', 'setOpen', 'toggle']),
    );

    // Escape closes the panel, matching the platform's modals
    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, setOpen]);

    return (
        <div className="ms-ai-assistant-float">
            {open && (
                <div className="ms-ai-assistant-float__panel">
                    <AiAssistantChatPanel
                        extraActions={
                            <Tooltip title={getIntlText('ai_assistant.collapse')}>
                                <IconButton onClick={() => setOpen(false)}>
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        }
                    />
                </div>
            )}
            <Tooltip
                placement="left"
                title={getIntlText(open ? 'ai_assistant.collapse' : 'ai_assistant.expand')}
            >
                <Fab
                    color="primary"
                    className="ms-ai-assistant-float__launcher"
                    aria-label={getIntlText('ai_assistant.title')}
                    aria-expanded={open}
                    onClick={toggle}
                >
                    {open ? <CloseIcon /> : <AutoAwesomeIcon />}
                </Fab>
            </Tooltip>
        </div>
    );
};

export default FloatingAiAssistant;
export { default as AiAssistantChatPanel } from './chat-panel';
export { default as useAiAssistantStore } from './store';
export type { AiAssistantChatPanelProps } from './chat-panel';
export type { DisplayMessage } from './store';
