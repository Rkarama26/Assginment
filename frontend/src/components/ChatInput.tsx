import { useState, type KeyboardEvent } from "react";
import styles from "./ChatInput.module.css";

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

const MAX_LENGTH = 4000;
const WARNING_THRESHOLD = 3600; // Start warning at 90% capacity
const CRITICAL_THRESHOLD = 3900; // Critical at 97.5% capacity

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const charCount = value.length;
  const isWarning =
    charCount >= WARNING_THRESHOLD && charCount < CRITICAL_THRESHOLD;
  const isCritical = charCount >= CRITICAL_THRESHOLD;

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputContainer}>
        <textarea
          className={styles.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          rows={2}
          disabled={disabled}
          maxLength={MAX_LENGTH}
        />
        {charCount > 0 && (
          <div
            className={`${styles.charCounter} ${
              isCritical ? styles.critical : isWarning ? styles.warning : ""
            }`}
          >
            {charCount} / {MAX_LENGTH}
            {isCritical && (
              <span className={styles.warningText}>
                {" "}
                (Limit nearly reached)
              </span>
            )}
          </div>
        )}
      </div>
      <button
        className={styles.button}
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        type="button"
      >
        {disabled ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
