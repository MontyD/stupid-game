export enum BroadcastGameMessages {
    CREATED = 'GAME:CREATED',
    PLAYER_JOINED = 'GAME:PLAYER_JOINED',
    PLAYER_DISCONNECTED = 'GAME:PLAYED_DISCONNECTED',
    STARTED = 'GAME:STARTED',
    ABORTED = 'GAME:ABORTED',
}

export enum SingleClientGameMessages {
    JOIN_SUCCESSFUL = 'GAME:JOIN_SUCCESSFUL',
}

export enum ClientToServerGameMessages {
    START = 'GAME:START',
}
