import { TopLevelClientToServerMessages, TopLevelServerToSingleClientMessages } from "../models/messages/top-level";
import { ObjectOfAny } from '../utils/types';
import { BroadcastGameMessages, SingleClientGameMessages } from '../models/messages/game';
import { ValidationError } from './validation-error';
import { Game } from './game';
import { Player } from './player';
import { JoinGameOptions } from "../controllers/game-controller";

export type RequestCommands = TopLevelServerToSingleClientMessages | BroadcastGameMessages | SingleClientGameMessages;

export class Client {

    public static createAsHost(socket: SocketIOClient.Socket): Promise<Client> {
        return (new Client(socket)).requestGameAsHost();
    }

    public static joinGameAsPlayer(socket: SocketIOClient.Socket, options: JoinGameOptions): Promise<Client> {
        return (new Client(socket)).joinGameAsPlayer(options);
    }

    public game?: Game;
    public player?: Player;
    public otherPlayers: Player[] = [];

    private constructor(private socket: SocketIOClient.Socket) { }

    public dispose(): void {
        this.socket.disconnect();
    }

    private async requestGameAsHost(): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.CREATE_GAME);

        const response = await this.takeNext(BroadcastGameMessages.CREATED);
        this.game = Game.from(response.game);
        this.player = Player.from(response.player);
        return this;
    }

    private async joinGameAsPlayer(options: JoinGameOptions): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.JOIN_GAME, options);

        const response = await this.takeNext(SingleClientGameMessages.JOIN_SUCCESSFUL);
        this.game = Game.from(response.game);
        this.player = Player.from(response.player);
        this.otherPlayers = response.otherPlayers.map(
            (playerEntity: ObjectOfAny) => Player.from(playerEntity)
        );
        return this;
    }

    private async takeNext(command: RequestCommands): Promise<ObjectOfAny> {
        const result = await Promise.race([
            this.handlerToKeyedPromise<ObjectOfAny>('success', command),
            this.handlerToKeyedPromise<string>(
                'validationError',
                TopLevelServerToSingleClientMessages.VALIDATION_ERROR
            ),
            this.handlerToKeyedPromise<string>('failure', TopLevelServerToSingleClientMessages.ERROR),
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
