import type { FastifyInstance } from "fastify";
import { ChatService, chatMessageSchema } from "../services/chat.service.js";
import { ValidationError } from "../errors.js";


export async function chatRoutes(app: FastifyInstance, chatService: ChatService) {
  app.post("/chat/message", async (request, reply) => {
    const parsed = chatMessageSchema.safeParse(request.body);

    if (!parsed.success) {
      throw new ValidationError("Invalid request body");
    }

    const result = await chatService.sendMessage(parsed.data);
    return reply.send(result);
  });

  app.get<{ Params: { sessionId: string } }>(
    "/chat/history/:sessionId",
    async (request, reply) => {
      const result = await chatService.getHistory(request.params.sessionId);
      return reply.send(result);
    },
  );
}
