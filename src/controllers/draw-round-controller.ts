import { logger } from "../logger";
import { RoundController } from "./round-controller";
import { BroadcastRoundMessages, ClientToServerRoundMessages } from "../models/messages/round";

export class DrawRoundController extends RoundController {
    public async start() {
        logger.info(`starting draw round controller for game ${this.gameId}`);
        this.send(BroadcastRoundMessages.START_INSTRUCTIONS);
        await this.waitForAll(ClientToServerRoundMessages.INSTRUCTIONS_COMPLETE);
    }
}
