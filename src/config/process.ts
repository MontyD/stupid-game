export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
export const ENV: string = process.env.NODE_ENV || 'development';
export const LOG_DIR: string = process.env.LOG_DIR || 'out';

export const DB_HOST: string = process.env.DB_HOST || 'localhost';
export const DB_PORT: number = process.env.DB_PORT ?  parseInt(process.env.DB_PORT, 10) : 27017;
export const DB_USERNAME: string = process.env.DB_USERNAME || '';
export const DB_PASSWORD: string = process.env.DB_PASSWORD || '';
export const DB_DATABASE: string = process.env.DB_DATABASE || 'game';
