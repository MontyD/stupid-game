import * as path from 'path';

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
export const ENV: string = process.env.NODE_ENV || 'development';
export const LOG_DIR: string = process.env.LOG_DIR || 'out';
