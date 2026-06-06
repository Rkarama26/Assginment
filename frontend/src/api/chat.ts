import type { ChatHistoryResponse, SendMessageResponse, ApiError } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const err = data as ApiError;
    throw new Error(err.error ?? "Something went wrong. Please try again.");
  }

  return data as T;
}

export async function sendMessage(
  message: string,
  sessionId?: string,
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_URL}/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId }),
  });

  return handleResponse<SendMessageResponse>(response);
}

export async function fetchHistory(sessionId: string): Promise<ChatHistoryResponse> {
  const response = await fetch(`${API_URL}/chat/history/${sessionId}`);

  return handleResponse<ChatHistoryResponse>(response);
}
