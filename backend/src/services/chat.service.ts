import { z } from "zod";
import { ValidationError, NotFoundError } from "../errors.js";
import type { MessageRepository } from "../db/repository.js";
import type { LLMService } from "./llm.service.js";

const MAX_MESSAGE_LENGTH = 4000;

const uuidSchema = z.string().uuid();

export const chatMessageSchema = z.object({
  message: z.string(),
  sessionId: z.string().uuid().optional(),
});

export class ChatService {
  constructor(
    private repo: MessageRepository,
    private llm: LLMService,
  ) {}

  private sanitizeMessage(raw: string): string {
    const trimmed = raw.trim();

    if (!trimmed) {
      throw new ValidationError("Message cannot be empty");
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      return trimmed.slice(0, MAX_MESSAGE_LENGTH);
    }

    return trimmed;
  }

  private async resolveSessionId(sessionId?: string): Promise<string> {
    if (!sessionId) {
      return this.repo.createConversation();
    }

    const parsed = uuidSchema.safeParse(sessionId);
    if (!parsed.success) {
      return this.repo.createConversation();
    }

    const exists = await this.repo.conversationExists(parsed.data);
    if (!exists) {
      return this.repo.createConversation();
    }

    return parsed.data;
  }

  async sendMessage(input: { message: string; sessionId?: string }) {
    const message = this.sanitizeMessage(input.message);
    const wasTruncated = input.message.trim().length > MAX_MESSAGE_LENGTH;

    const sessionId = await this.resolveSessionId(input.sessionId);

    await this.repo.addMessage(sessionId, "user", message);

    const history = await this.repo.getMessages(sessionId);
    const llmHistory = history
      .slice(0, -1)
      .map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

    const reply = await this.llm.generateReply({
      history: llmHistory,
      userMessage: message,
    });

    let finalReply = reply;
    if (wasTruncated) {
      finalReply = `${reply}\n\n(Note: Your message was truncated to ${MAX_MESSAGE_LENGTH} characters.)`;
    }

    await this.repo.addMessage(sessionId, "ai", finalReply);

    return { reply: finalReply, sessionId };
  }

  async getHistory(sessionId: string) {
    const parsed = uuidSchema.safeParse(sessionId);
    if (!parsed.success) {
      throw new ValidationError("Invalid session ID");
    }

    const exists = await this.repo.conversationExists(parsed.data);
    if (!exists) {
      throw new NotFoundError("Conversation not found");
    }

    const messages = await this.repo.getMessages(parsed.data);

    return {
      sessionId: parsed.data,
      messages: messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
