import styles from "./TypingIndicator.module.css";

export function TypingIndicator() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.bubble}>
        <span className={styles.label}>Spur Agent</span>
        <div className={styles.dots}>
          <span />
          <span />
          <span />
        </div>
        <span className={styles.text}>Agent is typing…</span>
      </div>
    </div>
  );
}
