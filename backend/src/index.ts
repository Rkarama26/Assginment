import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./config/env.js";
import { createDb } from "./db/client.js";
import { MessageRepository } from "./db/repository.js";
import { LLMService } from "./services/llm.service.js";
import { ChatService } from "./services/chat.service.js";
import { chatRoutes } from "./routes/chat.routes.js";
import { errorHandler } from "./middleware/error-handler.js";

async function main() {
  const env = loadEnv();

  const { db, client } = createDb(env.DATABASE_URL);
  const repo = new MessageRepository(db);
  const llm = new LLMService(env.GOOGLE_API_KEY);
  const chatService = new ChatService(repo, llm);

  const app = Fastify({ logger: env.NODE_ENV === "development" });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  });

  app.setErrorHandler(errorHandler);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(async (instance) => {
    await chatRoutes(instance, chatService);
  });

  const shutdown = async () => {
    await app.close();
    await client.end();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  console.log(`Server running on http://localhost:${env.PORT}`);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
