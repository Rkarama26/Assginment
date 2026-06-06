import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "../errors.js";

export function errorHandler(
  error: FastifyError | AppError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof AppError && error.isOperational) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  if ("validation" in error && error.validation) {
    return reply.status(400).send({ error: "Invalid request" });
  }

  console.error("Unhandled error:", error);
  return reply.status(500).send({
    error: "Something went wrong. Please try again.",
  });
}
