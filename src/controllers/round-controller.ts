import { Round } from "../models/entities/game-definition";
import { Server, Socket } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";
import { GameType } from "../models/entities/game";

export abstract class RoundController {
    protected finishListener?: () => void;
    private unsubscribers: Array<() => void> = [];

    protected get sockets(): Socket[] {
        const playersSocketIds = this.players.map(player => player.socketId);
        const sockets = this.server.sockets.sockets;
        return Object.keys(sockets).reduce((accumulator: Socket[], socketId) => {
            if (playersSocketIds.includes(socketId)) {
                accumulator.push(sockets[socketId]);
            }
            return accumulator;
        }, []);
    }

    constructor(
        protected round: Round,
        protected server: Server,
        protected players: PlayerType[],
        protected game: GameType
    ) {
        this.start = this.start.bind(this);
     }

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

            const attachHandler = (socket: Socket) => {
                const player = this.players.find(p => p.socketId === socket.id);
                if (!player) {
                    return;
                }

                socket.once(messageType, (args: ObjectOfAny) => {
                    responses.set(player.id, args);
                    if (responses.size === amountOfResponses) {
                        resolve(responses);
                    }
                });
            };

            this.sockets.forEach(attachHandler);
        });
    }
}
