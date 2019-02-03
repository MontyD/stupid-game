import { Round } from "../models/entities/game-definition";
import { Server, Socket } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";
import { GameType } from "../models/entities/game";

export abstract class RoundController {
    protected readonly sockets: Map<string, Socket> = new Map();

    protected finishListener?: () => void;
    private unsubscribers: Array<() => void> = [];

    constructor(
        protected round: Round,
        protected server: Server,
        protected players: PlayerType[],
        protected game: GameType
    ) {
        this.start = this.start.bind(this);

        const sockets = this.server.sockets.sockets;
        Object.keys(sockets).forEach(socketId => {
            const player = this.players.find(p => p.socketId === socketId);
            if (player) {
                this.sockets.set(player.id, sockets[socketId]);
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

    protected send(messageType: string, args: ObjectOfAny = {}): void {
        this.server.to(this.game.id).emit(messageType, args);
    }

    protected async waitForAll(
        messageType: ClientToServerRoundMessages,
        ignoreHost: boolean = false
    ): Promise<Map<string, ObjectOfAny>> {
        return new Promise<Map<string, ObjectOfAny>>((resolve, reject) => {
            const responses: Map<string, ObjectOfAny> = new Map();
            this.unsubscribers.push(reject);

            const attachHandler = (playerId: string, socket: Socket) => {
                socket.once(messageType, (args: ObjectOfAny) => {
                    const amountOfResponses = ignoreHost ? this.game.numberOfActivePlayers : this.players.length;
                    responses.set(playerId, args);
                    if (responses.size === amountOfResponses) {
                        resolve(responses);
                    }
                });
            };

            Array.from(this.sockets.entries()).forEach(([playerId, socket]) => attachHandler(playerId, socket));
        });
    }
}
