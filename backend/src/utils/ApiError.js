class ApiError extends Error {
    constructor(statusCode, message, errors) {
        this.statusCode = statusCode;
        super(message);
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;