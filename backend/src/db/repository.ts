import { eq, asc } from "drizzle-orm";
import type { Database } from "./client.js";
import { conversations, messages } from "./schema.js";

export type Sender = "user" | "ai";

export interface MessageRecord {
  id: string;
  sender: Sender;
  text: string;
  createdAt: Date;
}

export class MessageRepository {
  constructor(private db: Database) {}

  async createConversation(): Promise<string> {
    const [row] = await this.db.insert(conversations).values({}).returning({ id: conversations.id });
    return row.id;
  }

  async conversationExists(conversationId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);
    return !!row;
  }

  async addMessage(conversationId: string, sender: Sender, text: string): Promise<MessageRecord> {
    const [row] = await this.db
      .insert(messages)
      .values({ conversationId, sender, text })
      .returning({
        id: messages.id,
        sender: messages.sender,
        text: messages.text,
        createdAt: messages.createdAt,
      });

    return {
      id: row.id,
      sender: row.sender as Sender,
      text: row.text,
      createdAt: row.createdAt,
    };
  }

  async getMessages(conversationId: string): Promise<MessageRecord[]> {
    const rows = await this.db
      .select({
        id: messages.id,
        sender: messages.sender,
        text: messages.text,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return rows.map((row) => ({
      id: row.id,
      sender: row.sender as Sender,
      text: row.text,
      createdAt: row.createdAt,
    }));
  }
}
