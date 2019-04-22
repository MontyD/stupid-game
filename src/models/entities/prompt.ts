export enum PromptType {
    DRAW = 'DRAW',
    STRING = 'STRING',
}

export class Prompt {

    constructor(
        public type: PromptType,
        public timeoutMs: number,
        public text?: string,
        public data?: ArrayBuffer
    ) { }
}
