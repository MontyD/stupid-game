import { Round } from "../models/entities/game-definition";
import { Server } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";
import { GameType } from "../models/entities/game";

export abstract class RoundController {
    protected finishListener?: () => void;
    private unsubscribers: Array<[string, (...args: any[]) => void, (() => void)?]> = [];

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
        this.unsubscribers.forEach(([type, handler, optionalOnUnsubscribe]) => {
            this.server.in(this.game.id).off(type, handler);
            if (optionalOnUnsubscribe) {
                optionalOnUnsubscribe();
            }
        });
    }

    protected send(messageType: string, args: ObjectOfAny = {}): void {
        this.server.to(this.game.id).emit(messageType, args);
    }

    protected async waitForAll(messageType: ClientToServerRoundMessages): Promise<ObjectOfAny[]> {
        return new Promise<ObjectOfAny[]>((resolve, reject) => {
            const responses: ObjectOfAny[] = [];
            const handler = (args: ObjectOfAny) => {
                responses.push(args);
                if (responses.length === this.players.length) {
                    complete();
                }
            };
            const complete = () => {
                this.unsubscribers = this.unsubscribers.filter(entry => (
                    entry[0] !== messageType && entry[1] !== handler && entry[2] !== reject
                ));
                this.server.in(this.game.id).off(messageType, handler);
                resolve();
            };
            this.unsubscribers.push([messageType, handler, reject]);
            this.server.in(this.game.id).on(messageType, handler);
        });
    }
}
