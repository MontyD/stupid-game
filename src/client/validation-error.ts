import { RequestCommands } from './client';

export class ValidationError extends Error {

    public command: RequestCommands;

    constructor(message: string, command: RequestCommands) {
        super(message);
        this.command = command;
    }

}
