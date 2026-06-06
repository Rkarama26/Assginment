import { useChat } from "../hooks/useChat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import styles from "./ChatWidget.module.css";

export function ChatWidget() {
  const { messages, isLoading, isSending, error, send, clearError } = useChat();

  return (
    <div className={styles.widget}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Spur Boutique Support</h1>
          <p className={styles.subtitle}>AI-powered live chat</p>
        </div>
        <span className={styles.status}>Online</span>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError} className={styles.errorDismiss}>
            ×
          </button>
        </div>
      )}

      <MessageList messages={messages} isSending={isSending} isLoading={isLoading} />
      <ChatInput onSend={send} disabled={isSending} />
    </div>
  );
}
