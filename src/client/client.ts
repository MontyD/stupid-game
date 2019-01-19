import { TopLevelClientToServerMessages, TopLevelServerToSingleClientMessages } from "../models/messages/top-level";
import { ObjectOfAny } from '../utils/types';
import { BroadcastGameMessages, SingleClientGameMessages } from '../models/messages/game';
import { ValidationError } from './validation-error';
import { JoinGameOptions } from "../controllers/game-controller";
import { PlayerDTO } from "../models/entities/player";
import { GameDTO } from "../models/entities/game";
import { GameDefinitionDTO } from "../models/entities/gameDefinition";

export type RequestCommands = TopLevelServerToSingleClientMessages | BroadcastGameMessages | SingleClientGameMessages;

type PlayerHandler = (player: PlayerDTO) => void;

export class Client {

    public static createAsHost(socket: SocketIOClient.Socket): Promise<Client> {
        return (new Client(socket)).requestGameAsHost();
    }

    public static joinGameAsPlayer(socket: SocketIOClient.Socket, options: JoinGameOptions): Promise<Client> {
        return (new Client(socket)).joinGameAsPlayer(options);
    }

    public game?: GameDTO;
    public gameDefinition?: GameDefinitionDTO;
    public player?: PlayerDTO;
    public otherPlayers: PlayerDTO[] = [];

    private playerJoinedHandlers: PlayerHandler[] = [];
    private playerLeftHandlers: PlayerHandler[] = [];

    private constructor(private socket: SocketIOClient.Socket) { }

    public onPlayerJoined(handler: PlayerHandler) {
        this.playerJoinedHandlers.push(handler);
    }

    public onPlayerLeft(handler: PlayerHandler) {
        this.playerLeftHandlers.push(handler);
    }

    public dispose(): void {
        this.socket.disconnect();
    }

    private async requestGameAsHost(): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.CREATE_GAME);

        const { game, player, gameDefinition } = await this.takeNext(BroadcastGameMessages.CREATED);
        this.game = game;
        this.player = player;
        this.gameDefinition = gameDefinition;
        this.setupHandlers();
        return this;
    }

    private async joinGameAsPlayer(options: JoinGameOptions): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.JOIN_GAME, options);

        const {
             game, player, gameDefinition, otherPlayers,
        } = await this.takeNext(SingleClientGameMessages.JOIN_SUCCESSFUL);
        this.game = game;
        this.player = player;
        this.gameDefinition = gameDefinition;
        this.otherPlayers = otherPlayers;
        this.setupHandlers();
        return this;
    }

    private handlePlayerJoined({ game, player }: { game: GameDTO, player: PlayerDTO }): void {
        this.game = game;
        this.otherPlayers.push(player);
        this.playerJoinedHandlers.forEach(handler => handler(player));
    }

    private handlePlayerLeft({ player: gonePlayer }: { player: PlayerDTO}): void {
        this.otherPlayers = this.otherPlayers.filter(existingPlayer => existingPlayer.id !== gonePlayer.id);
        this.playerLeftHandlers.forEach(handler => handler(gonePlayer));
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

    private handlerToKeyedPromise<T>(keyName: string, eventName: string): Promise<{ [key: string]: T }> {
        return new Promise((resolve) => this.socket.once(eventName, (arg: any) => resolve({ [keyName]: arg })));
    }

    private setupHandlers() {
        this.socket.on(BroadcastGameMessages.PLAYER_JOINED, this.handlePlayerJoined.bind(this));
        this.socket.on(BroadcastGameMessages.PLAYER_DISCONNECTED, this.handlePlayerLeft.bind(this));
    }

}
