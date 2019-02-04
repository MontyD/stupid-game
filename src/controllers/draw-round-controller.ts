import { logger } from "../logger";
import { RoundController } from "./round-controller";
import {
    BroadcastRoundMessages,
    ClientToServerRoundMessages,
    SingleClientRoundMessages
} from "../models/messages/round";
import { Prompt, PromptType } from "../models/entities/prompt";
import { ObjectOfAny } from "../utils/types";

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

        const onPlayerResponse = (playerId: string) => {
            logger.info(`Got response for ${playerId}`);
            this.sendToAll(BroadcastRoundMessages.PLAYER_RESPONSE, { playerId });
        };

        const timeout = this.DRAW_TIME_MS + this.ALLOWED_LATENCY_MS;
        const responses = await this.waitForAll(ClientToServerRoundMessages.RESPONSE, true, onPlayerResponse, timeout);

        this.sendToAll(BroadcastRoundMessages.PROMPT_COMPLETE);
        this.handleRoundError(() => this.doHandleGuesses(responses));
    }

    private async doHandleGuesses(prompts: Map<string, ObjectOfAny>) {
        // TODO
        logger.log(prompts);
    }
}
