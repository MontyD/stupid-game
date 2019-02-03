export enum PromptType {
    DRAW = 'DRAW',
}

export class Prompt {

    constructor(
        public type: PromptType,
        public text: string,
        public timeoutMs: number
    ) { }
}
