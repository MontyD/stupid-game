import { Round } from "../models/entities/game-definition";
import { Server } from "socket.io";
import { ObjectOfAny } from "../utils/types";
import { PlayerType } from "../models/entities/player";
import { ClientToServerRoundMessages } from "../models/messages/round";

export abstract class RoundController {
    protected finishListener?: () => void;

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

    protected send(messageType: string, args: ObjectOfAny = {}): void {
        this.server.to(this.gameId).emit(messageType, args);
    }

    protected async waitForAll(messageType: ClientToServerRoundMessages): Promise<ObjectOfAny[]> {
        return new Promise((resolve) => resolve([]));
    }
}
