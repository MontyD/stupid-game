import { TopLevelClientToServerMessages, TopLevelServerToClientMessages } from "../models/messages/top-level";
import { ObjectOfAny } from '../utils/types';
import { GameMessages } from '../models/messages/game';
import { ValidationError } from './validation-error';
import { Game } from './game';
import { Player } from './player';

export type RequestCommands = TopLevelServerToClientMessages | GameMessages;

export class Client {

    public static createAsHost(socket: SocketIOClient.Socket): Promise<Client> {
        return (new Client(socket)).requestGameAsHost();
    }

    public game?: Game;
    public players: Player[] = [];

    private constructor(private socket: SocketIOClient.Socket) { }

    public dispose(): void {
        this.socket.disconnect();
    }

    private async requestGameAsHost(): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.CREATE_GAME);

        const response = await this.takeNext(GameMessages.CREATED);
        this.game = Game.from(response.game);
        this.players.push(Player.from(response.player));
        return this;
    }

    private async takeNext(command: RequestCommands): Promise<ObjectOfAny> {
        const result = await Promise.race([
            this.handlerToKeyedPromise<ObjectOfAny>('success', command),
            this.handlerToKeyedPromise<string>('validationError', TopLevelServerToClientMessages.VALIDATION_ERROR),
            this.handlerToKeyedPromise<string>('failure', TopLevelServerToClientMessages.ERROR),
        ]);

        if (result.validationError) {
            throw new ValidationError(result.validationError as string, command);
        }
        if (result.failure) {
            throw new Error(result.failure as string);
        }
        return result.success as ObjectOfAny;
    }

    private handlerToKeyedPromise<T>(keyName: string, eventName: string): Promise<{[key: string]: T}> {
        return new Promise((resolve) => this.socket.once(eventName, (arg: any) => resolve({ [keyName]: arg} )));
    }

}
