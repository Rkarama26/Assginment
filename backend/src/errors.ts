export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class LLMError extends AppError {
  constructor(message: string) {
    super(message, 502);
    this.name = "LLMError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}
