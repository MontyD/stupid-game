import { Round } from "../models/entities/game-definition";
import { Server } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";

export abstract class RoundController {
    protected finishListener?: () => void;
    private unsubscribers: Array<[string, (...args: any[]) => void, (() => void)?]> = [];

    constructor(
        protected round: Round,
        protected server: Server,
        protected players: PlayerType[],
        protected gameId: string
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
            this.server.in(this.gameId).off(type, handler);
            if (optionalOnUnsubscribe) {
                optionalOnUnsubscribe();
            }
        });
    }

    protected send(messageType: string, args: ObjectOfAny = {}): void {
        this.server.to(this.gameId).emit(messageType, args);
    }

    protected async waitForAll(messageType: ClientToServerRoundMessages): Promise<Map<string, ObjectOfAny>> {
        return new Promise<Map<string, ObjectOfAny>>((resolve, reject) => {
            const responses = new Map<string, ObjectOfAny>();
            const handler = () => { resolve(responses); };
            this.unsubscribers.push([messageType, handler, reject]);
            this.server.in(this.gameId).on(messageType, handler);
        });
    }
}
