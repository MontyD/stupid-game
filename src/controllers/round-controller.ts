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
    private currentTimeout?: NodeJS.Timeout;
    private unsubscribers: Array<() => void> = [];

    constructor(
        protected round: Round,
        protected server: Server,
        protected players: PlayerType[],
        protected game: GameType,
        protected readonly roundIndex: number
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
        this.clearCurrentTimeout();
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
        singleResponseListener?: (playerId: string, args: ObjectOfAny) => void,
        timeout?: number
    ): Promise<Map<string, ObjectOfAny> | null> {
        return new Promise<Map<string, ObjectOfAny> | null>((resolve, reject) => {
            const responses: Map<string, ObjectOfAny> = new Map();
            let responseCount = 0;
            this.unsubscribers.push(reject);

            const attachHandler = (playerId: string, socket: Socket) => {
                socket.once(messageType, (args: ObjectOfAny) => {
                    const amountOfResponses = ignoreHost ? this.game.numberOfActivePlayers : this.players.length;
                    responseCount++;
                    if (singleResponseListener) {
                        singleResponseListener(playerId, args);
                    } else {
                        responses.set(playerId, args);
                    }
                    if (responseCount === amountOfResponses) {
                        this.clearCurrentTimeout();
                        resolve(singleResponseListener ? responses : null);
                    }
                });
            };

            if (timeout) {
                this.setCurrentTimeout(() => resolve(singleResponseListener ? responses : null), timeout);
            }
            Array.from(this.sockets.entries()).forEach(([playerId, socket]) => attachHandler(playerId, socket));
        });
    }

    protected handleRoundError(handler: () => Promise<void>): () => Promise<void> {
        return async () => {
            try {
                await handler.apply(this);
            } catch (error) {
                this.emitError(error);
            }
        };
    }

    protected emitError(error: Error) {
        logger.error(
            `Exception in round controller on game ${this.game.id}`,
            this.game.id,
            error && error.toString(),
            error && error.stack
        );
        this.server.to(this.game.id).emit(TopLevelServerToSingleClientMessages.ERROR, 'Unhandled round error');
    }

    protected setCurrentTimeout(callback: (...args: any[]) => void, timeout: number) {
        this.currentTimeout = setTimeout(callback, timeout);
    }

    protected clearCurrentTimeout() {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }
    }
}
