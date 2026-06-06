import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "../config/store-knowledge.js";
import { LLMError } from "../errors.js";
import "dotenv/config";

const MAX_HISTORY_MESSAGES = 20;
const MAX_TOKENS = 500;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export class LLMService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async generateReply(params: {
    history: ChatHistoryMessage[];
    userMessage: string;
  }): Promise<string> {
    const trimmedHistory = params.history.slice(-MAX_HISTORY_MESSAGES);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const model = this.client.getGenerativeModel({
          model: "gemini-3.5-flash",
          systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({
          history: trimmedHistory.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
        });

        const response = await chat.sendMessage(params.userMessage);
        const reply = response.response.text()?.trim();

        if (!reply) {
          throw new LLMError(
            "Our support agent is temporarily unavailable. Please try again.",
          );
        }

        return reply;
      } catch (error) {
        if (error instanceof LLMError) throw error;

        const err = error as {
          status?: number;
          code?: string;
          message?: string;
          name?: string;
        };

        lastError = error as Error;

        // Handle authentication errors
        if (err.status === 401 || err.message?.includes("API key")) {
          throw new LLMError(
            "Our support agent is temporarily unavailable. Please try again later.",
          );
        }

        // Handle rate limiting (429)
        if (err.status === 429 || err.message?.includes("429")) {
          if (attempt < MAX_RETRIES - 1) {
            const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
            console.log(
              `Rate limited. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await this.sleep(delayMs);
            continue;
          }
          throw new LLMError(
            "We're experiencing high demand. Please wait a moment and try again.",
          );
        }

        // Handle timeout errors
        if (err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
          if (attempt < MAX_RETRIES - 1) {
            const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
            console.log(
              `Timeout. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await this.sleep(delayMs);
            continue;
          }
          throw new LLMError("The request took too long. Please try again.");
        }

        if (attempt === MAX_RETRIES - 1) {
          console.error("LLM API error:", error);
          throw new LLMError(
            "Our support agent is temporarily unavailable. Please try again.",
          );
        }
      }
    }

    throw (
      lastError ||
      new LLMError(
        "Our support agent is temporarily unavailable. Please try again.",
      )
    );
  }
}
