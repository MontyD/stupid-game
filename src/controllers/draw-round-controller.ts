import { logger } from "../logger";
import { RoundController } from "./round-controller";

export class DrawRoundController extends RoundController {
    public async start() {
        logger.info(`starting draw round controller for game ${this.gameId}`);
    }
}
