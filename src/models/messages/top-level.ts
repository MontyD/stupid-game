export enum TopLevelClientToServerMessages {
    CREATE_GAME = 'CREATE_GAME',
    JOIN_GAME = 'JOIN_GAME',
    RECONNECT_TO_GAME = 'RECONNECT',
}

export enum TopLevelServerToClientMessages {
    ERROR = 'ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
}
