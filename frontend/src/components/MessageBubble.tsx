import type { Message } from "../types";
import styles from "./MessageBubble.module.css";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.sender === "user";

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAi}`}>
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAi}`}>
        {!isUser && <span className={styles.label}>Spur Agent</span>}
        <p className={styles.text}>{message.text}</p>
      </div>
    </div>
  );
}
