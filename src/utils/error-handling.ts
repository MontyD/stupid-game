
export const retryWithErrorHandling = async <T>(action: () => Promise<T>, retryTimes: number = 5): Promise<T> => {
    let lastError: Error | null = null;
    while (--retryTimes >= 0) {
        try {
            return await action();
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
};
