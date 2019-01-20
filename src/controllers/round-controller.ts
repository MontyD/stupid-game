import { Round } from "../models/entities/game-definition";
import { Server } from "socket.io";
import { ObjectOfAny } from "../utils/types";

export abstract class RoundController {
    protected finishListener?: () => void;

    constructor(protected round: Round, protected server: Server, protected gameId: string) { }

    public abstract start(): Promise<void>;
    public onFinished(callback: () => void) {
        this.finishListener = callback;
    }

    protected send(messageType: string, args: ObjectOfAny): void {
        this.server.to(this.gameId).emit(messageType, args);
    }
}
