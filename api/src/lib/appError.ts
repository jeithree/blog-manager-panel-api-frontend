export class AppError extends Error {
	statusCode: number;
	errorCode: string;

	constructor(statusCode: number, errorCode: string, message: string) {
		super(message);
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.name = this.constructor.name;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export class BadRequestError extends AppError {
	constructor(message: string, errorCode = 'BAD_REQUEST') {
		super(400, errorCode, message);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message: string, errorCode = 'UNAUTHORIZED') {
		super(401, errorCode, message);
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string, errorCode = 'FORBIDDEN') {
		super(403, errorCode, message);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string, errorCode = 'NOT_FOUND') {
		super(404, errorCode, message);
	}
}

export class ConflictError extends AppError {
	constructor(message: string, errorCode = 'CONFLICT') {
		super(409, errorCode, message);
	}
}

export class RateLimitError extends AppError {
	constructor(message: string, errorCode = 'RATE_LIMIT_EXCEEDED') {
		super(429, errorCode, message);
	}
}

export class InternalServerError extends AppError {
	constructor(message: string, errorCode = 'INTERNAL_SERVER_ERROR') {
		super(500, errorCode, message);
	}
}
