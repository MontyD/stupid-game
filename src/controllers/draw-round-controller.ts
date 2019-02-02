import { logger } from "../logger";
import { RoundController } from "./round-controller";
import { BroadcastRoundMessages, ClientToServerRoundMessages } from "../models/messages/round";

export class DrawRoundController extends RoundController {

    protected static readonly type: string = "DRAW_ROUND";

    public async start() {
        logger.info(`starting draw round controller for game ${this.game.id}`);
        this.send(BroadcastRoundMessages.STARTED, {
            type: DrawRoundController.type,
        });
        await this.waitForAll(ClientToServerRoundMessages.READY_TO_TAKE_PROMPT);
        await this.send(BroadcastRoundMessages.PROMPT);
    }
}
