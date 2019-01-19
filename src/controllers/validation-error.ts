export const validationErrorName = 'ValidationError';

export class ValidationError extends Error {
    public readonly name: string = validationErrorName;
}
