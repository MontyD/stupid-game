export class Migration {
    constructor(
        private shouldRun: () => Promise<boolean>,
        private up: () => Promise<boolean>
    ) { }

    public async execute(): Promise<boolean> {
        const shouldExecute = await this.shouldRun();
        if (shouldExecute) {
            return this.up();
        }
        return false;
    }
}
