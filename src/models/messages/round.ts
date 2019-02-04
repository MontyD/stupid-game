export enum BroadcastRoundMessages {
    STARTED = 'ROUND:STARTED',
    PLAYER_RESPONSE = 'ROUND:PLAYER_RESPONSE',
    PROMPT_COMPLETE = 'ROUND:PROMPT_COMPLETE',
}

export enum SingleClientRoundMessages {
    PROMPT = 'PROMPT',
}

export enum ClientToServerRoundMessages {
    READY_TO_TAKE_PROMPT = 'ROUND:READY_TO_TAKE_PROMPT',
    RESPONSE = 'ROUND:RESPONSE',
}
