export type Sender = "user" | "ai";

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  createdAt: string;
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: Message[];
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface ApiError {
  error: string;
}
