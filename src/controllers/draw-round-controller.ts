import { logger } from "../logger";
import { RoundController } from "./round-controller";
import {
    BroadcastRoundMessages,
    ClientToServerRoundMessages,
    SingleClientRoundMessages
} from "../models/messages/round";
import { Prompt, PromptType } from "../models/entities/prompt";
import { ObjectOfAny } from "../utils/types";
import { Image } from "../models/entities/image";
import { Round } from "../models/entities/game-definition";
import { PlayerType } from "../models/entities/player";
import { GameType } from "../models/entities/game";

export class DrawRoundController extends RoundController {

    protected static readonly TYPE: string = "DRAW_ROUND";
    private readonly DRAW_TIME_MS: number = 30000;
    private playerIdToQuestionIndex: Map<string, number> = new Map();

    constructor(round: Round, server: SocketIO.Server, players: PlayerType[], game: GameType, roundIndex: number) {
        super(round, server, players, game, roundIndex);

        this.doDrawPrompts = this.handleRoundError(this.doDrawPrompts);
        this.doHandleGuesses = this.handleRoundError(this.doHandleGuesses);
    }


    public async start() {
        logger.info(`starting draw round controller for game ${this.game.id}`);
        this.sendToAll(BroadcastRoundMessages.STARTED, {
            type: DrawRoundController.TYPE,
        });
        await this.waitForAll(ClientToServerRoundMessages.READY_TO_TAKE_PROMPT);

        this.doDrawPrompts();
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

        const onPlayerResponse = async (playerId: string, args: ObjectOfAny) => {
            logger.info(`Got image response for ${playerId}`);
            const player = this.players.find(p => p.id === playerId);
            if (!player) {
                return;
            }

            try {
                await Image.createAndSave(args.data, player._id, this.game._id, this.roundIndex);
                this.sendToPlayer(player, SingleClientRoundMessages.RESPONSE_RECEIVED);
                this.sendToAll(BroadcastRoundMessages.PLAYER_RESPONSE, { playerId });
            } catch (err) {
                this.emitError(err, playerId);
            }
        };

        const timeout = this.DRAW_TIME_MS + this.ALLOWED_LATENCY_MS;
        await this.waitForAll(ClientToServerRoundMessages.RESPONSE, true, onPlayerResponse, timeout);

        this.sendToAll(BroadcastRoundMessages.PROMPT_COMPLETE);
        this.doHandleGuesses();
    }

    private async doHandleGuesses() {
        // TODO
        logger.log('hi');
    }
}
