import { Round } from "../models/entities/game-definition";
import { Server, Socket } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";
import { GameType } from "../models/entities/game";
import { logger } from "../logger";
import { TopLevelServerToSingleClientMessages } from "../models/messages/top-level";

export abstract class RoundController {
    protected readonly sockets: Map<string, Socket> = new Map();

    protected finishListener?: () => void;
    protected readonly ALLOWED_LATENCY_MS: number = 5000;
    private unsubscribers: Array<() => void> = [];

    constructor(
        protected round: Round,
        protected server: Server,
        protected players: PlayerType[],
        protected game: GameType
    ) {
        this.start = this.handleRoundError(this.start);

        const sockets = this.server.sockets.sockets;
        this.players.forEach(player => {
            const socket = sockets[player.socketId];
            if (socket) {
                this.sockets.set(player.id, socket);
            }
        });
    }

    public abstract start(): Promise<void>;

    public onFinished(callback: () => void) {
        this.finishListener = callback;
    }

    public removePlayer(player: PlayerType): void {
        this.sockets.delete(player.id);
        this.players = this.players.filter(existingPlayer => existingPlayer.id !== player.id);
    }

    public destroy(): void {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
    }

    protected sendToAll(messageType: string, args: ObjectOfAny = {}): void {
        this.server.to(this.game.id).emit(messageType, args);
    }

    protected allActivePlayers(): PlayerType[] {
        return this.players.filter(player => !player.isHost);
    }

    protected sendToPlayer(player: PlayerType, message: string, args: ObjectOfAny): boolean {
        const socket = this.sockets.get(player.id);
        if (socket) {
            socket.emit(message, args);
            return true;
        }
        return false;
    }

    protected async waitForAll(
        messageType: ClientToServerRoundMessages,
        ignoreHost: boolean = false,
        singleResponseListener?: (playerId: string, response: ObjectOfAny) => void
    ): Promise<Map<string, ObjectOfAny>> {
        return new Promise<Map<string, ObjectOfAny>>((resolve, reject) => {
            const responses: Map<string, ObjectOfAny> = new Map();
            this.unsubscribers.push(reject);

            const attachHandler = (playerId: string, socket: Socket) => {
                socket.once(messageType, (args: ObjectOfAny) => {
                    const amountOfResponses = ignoreHost ? this.game.numberOfActivePlayers : this.players.length;
                    responses.set(playerId, args);
                    if (singleResponseListener) {
                        singleResponseListener(playerId, args);
                    }
                    if (responses.size === amountOfResponses) {
                        resolve(responses);
                    }
                });
            };

            Array.from(this.sockets.entries()).forEach(([playerId, socket]) => attachHandler(playerId, socket));
        });
    }

    protected handleRoundError(handler: () => Promise<void>): () => Promise<void> {
        return async () => {
            try {
                await handler.apply(this);
            } catch (error) {
                logger.error(
                    'Exception in round controller on game ${this.game.id}',
                    this.game.id,
                    error && error.toString(),
                    error && error.stack
                );
                this.server.to(this.game.id).emit(TopLevelServerToSingleClientMessages.ERROR, 'Unhandled round error');
            }
        };
    }
}
