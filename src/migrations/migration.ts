import { addQuestionsMigration } from "./add-questions";
import { logger } from "../logger";


const migrations: Migration[] = [
    addQuestionsMigration,
];

export const runMigrations = async () => {
    logger.info(`Running ${migrations.length} migration(s)`);
    const promises = migrations.map(migration => migration.execute());
    await Promise.all(promises);
};

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
