import { logger } from "../logger";
import { Migration } from './migration';
import { addQuestionsMigration } from "./add-questions";

const migrations: Migration[] = [
    addQuestionsMigration,
];

export const runMigrations = async () => {
    logger.info(`Running ${migrations.length} migration(s)`);
    const promises = migrations.map(migration => migration.execute());
    await Promise.all(promises);
};
