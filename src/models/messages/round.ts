export enum BroadcastRoundMessages {
    STARTED = 'ROUND:STARTED',
}

export enum SingleClientRoundMessages {
    PROMPT = 'PROMPT',
}

export enum ClientToServerRoundMessages {
    READY_TO_TAKE_PROMPT = 'ROUND:READY_TO_TAKE_PROMPT',
}
