export const randomString = () => ((Math.random() + 3 * Number.MIN_VALUE) / Math.PI).toString(36).slice(-5);
