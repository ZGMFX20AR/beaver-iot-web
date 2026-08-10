import { AiAssistantChatPanel } from '@/components';

/**
 * Full-page AI assistant.
 *
 * The assistant is normally reached through the floating widget the layout mounts on
 * data pages; this route stays available as a full-screen view and for existing links.
 * It shares the widget's store, so the same conversation shows up in both.
 */
const AiAssistant = () => <AiAssistantChatPanel />;

export default AiAssistant;
