import { useCallback, useEffect, useState } from "react";
import { fetchHistory, sendMessage } from "../api/chat";
import type { Message } from "../types";

const SESSION_KEY = "spur_chat_session_id";

function loadSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function saveSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(loadSessionId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadSessionId();
    if (!stored) return;

    setIsLoading(true);
    fetchHistory(stored)
      .then((data) => {
        setMessages(data.messages);
        setSessionId(data.sessionId);
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setSessionId(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      setError(null);
      setIsSending(true);

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        sender: "user",
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const result = await sendMessage(trimmed, sessionId ?? undefined);

        saveSessionId(result.sessionId);
        setSessionId(result.sessionId);

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: result.reply,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [sessionId, isSending],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isLoading,
    isSending,
    error,
    send,
    clearError,
  };
}
