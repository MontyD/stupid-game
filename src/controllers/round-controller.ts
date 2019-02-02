import { Round } from "../models/entities/game-definition";
import { Server, Socket } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";
import { GameType, Game } from "../models/entities/game";
import { logger } from "../logger";

export abstract class RoundController {
    protected finishListener?: () => void;
    private unsubscribers: Array<() => void> = [];

    protected get sockets(): {[key: string]: Socket} {
        return this.server.in(this.game.id).sockets || {};
    }

    constructor(
        protected round: Round,
        protected server: Server,
        protected players: PlayerType[],
        protected game: GameType
    ) { }

    public abstract start(): Promise<void>;

    public onFinished(callback: () => void) {
        this.finishListener = callback;
    }

    public removePlayer(player: PlayerType): void {
        this.players = this.players.filter(existingPlayer => existingPlayer.id !== player.id);
    }

    public destroy(): void {
        this.unsubscribers.forEach(unsubscribe => unsubscribe());
    }

    protected send(messageType: string, args: ObjectOfAny = {}): void {
        this.server.to(this.game.id).emit(messageType, args);
    }

    protected async waitForAll(
        messageType: ClientToServerRoundMessages,
        ignoreHost: boolean = false
    ): Promise<Map<string, ObjectOfAny>> {
        return new Promise<Map<string, ObjectOfAny>>((resolve, reject) => {
            const amountOfResponses = ignoreHost ? this.game.numberOfActivePlayers : this.players.length;
            const responses: Map<string, ObjectOfAny> = new Map();
            this.unsubscribers.push(reject);

            const attachHandler = (socketId: string, socket: Socket) => {
                const player = this.players.find(p => p.socketId === socketId);
                if (!player) {
                    logger.warn(`Tried to add a listener for no player on socket id ${socketId}`);
                    return;
                }

                socket.once(messageType, (args: ObjectOfAny) => {
                    responses.set(player.id, args);
                    if (responses.size === amountOfResponses) {
                        resolve(responses);
                    }
                });
            };

            Object.keys(this.sockets).forEach(socketId => {
                attachHandler(socketId, this.sockets[socketId]);
            });
        });
    }
}
