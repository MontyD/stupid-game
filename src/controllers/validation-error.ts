export const validationErrorName = 'ValidationError';

export class ValidationError extends Error {

    public static isValidationError(entity?: Error): entity is ValidationError {
        return !!entity &&  entity.name === ValidationError.name;
    }

    public readonly name: string = validationErrorName;
}
