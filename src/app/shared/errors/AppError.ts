class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, stack = "") {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.name = this.constructor.name;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
