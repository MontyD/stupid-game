import { logger } from "../logger";
import { RoundController } from "./round-controller";
import {
    BroadcastRoundMessages,
    ClientToServerRoundMessages,
    SingleClientRoundMessages
} from "../models/messages/round";
import { Prompt, PromptType } from "../models/entities/prompt";
import { pause } from "../utils/async";

export class DrawRoundController extends RoundController {

    protected static readonly TYPE: string = "DRAW_ROUND";
    private readonly DRAW_TIME_MS: number = 30000;
    private playerIdToQuestionIndex: Map<string, number> = new Map();

    public async start() {
        logger.info(`starting draw round controller for game ${this.game.id}`);
        this.sendToAll(BroadcastRoundMessages.STARTED, {
            type: DrawRoundController.TYPE,
        });
        await this.waitForAll(ClientToServerRoundMessages.READY_TO_TAKE_PROMPT);
        await pause(50);

        this.handleRoundError(this.doDrawPrompts)();
    }

    private async doDrawPrompts() {
        this.allActivePlayers().forEach((player, index) => {
            logger.info(`Sending prompt for draw controller to player ${player.id}`);

            this.playerIdToQuestionIndex.set(player.id, index);
            this.sendToPlayer(player, SingleClientRoundMessages.PROMPT, new Prompt(
                PromptType.DRAW,
                this.round.questions[index].text,
                this.DRAW_TIME_MS
            ));
        });

        await pause(this.DRAW_TIME_MS + this.ALLOWED_LATENCY_MS);
    }
}
