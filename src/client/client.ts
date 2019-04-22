import { TopLevelClientToServerMessages, TopLevelServerToSingleClientMessages } from "../models/messages/top-level";
import { ObjectOfAny } from '../utils/types';
import { BroadcastGameMessages, SingleClientGameMessages, ClientToServerGameMessages } from '../models/messages/game';
import { JoinGameOptions } from "../controllers/game-controller";
import { PlayerDTO } from "../models/entities/player";
import { GameDTO, GameRunState } from "../models/entities/game";
import { GameDefinitionDTO } from "../models/entities/game-definition";
import { ValidationError } from "../controllers/validation-error";
import {
    BroadcastRoundMessages,
    ClientToServerRoundMessages,
    SingleClientRoundMessages
} from "../models/messages/round";
import { Prompt } from "../models/entities/prompt";

export type RequestCommands = TopLevelServerToSingleClientMessages |
                                BroadcastGameMessages |
                                SingleClientGameMessages |
                                BroadcastRoundMessages |
                                SingleClientRoundMessages;

export enum ClientEvent {
    PLAYER_JOINED,
    PLAYER_LEFT,
    GAME_STARTED,
    PLAYER_RESPONSE,
}

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

    private eventHandlers: Map<ClientEvent, Array<(arg: ObjectOfAny) => void>> = new Map();

    private constructor(private socket: SocketIOClient.Socket) { }

    public async startGame() {
        this.socket.emit(ClientToServerGameMessages.START);
        await this.takeNext(BroadcastGameMessages.STARTED);
        await this.takeNext(BroadcastRoundMessages.STARTED);
    }

    public async instructionsComplete(): Promise<Prompt | null> {
        this.socket.emit(ClientToServerRoundMessages.READY_TO_TAKE_PROMPT);
        if (!this.player || this.player.isHost) {
            return null;
        }

        const response = await this.takeNext(SingleClientRoundMessages.PROMPT);
        return response as Prompt;
    }

    public async sendImageResponse(data: ArrayBuffer) {
        this.socket.emit(ClientToServerRoundMessages.RESPONSE, { data });
        this.takeNext(SingleClientRoundMessages.RESPONSE_RECEIVED);
    }

    public async waitForNextPrompt() {
        this.takeNext(BroadcastRoundMessages.PROMPT_COMPLETE);
        this.socket.emit(ClientToServerRoundMessages.READY_TO_TAKE_PROMPT);
    }

    public on(event: ClientEvent, handler: (arg: ObjectOfAny) => void) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.push(handler);
        this.eventHandlers.set(event, handlers);
    }

    public off(event: ClientEvent, handler: (arg: ObjectOfAny) => void) {
        const handlers = (this.eventHandlers.get(event) || []).filter(
            existingHandler => existingHandler !== handler
        );
        this.eventHandlers.set(event, handlers);
    }

    public dispose(): void {
        this.socket.disconnect();
    }

    private async requestGameAsHost(): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.CREATE_GAME);

        const { game, player } = await this.takeNext(BroadcastGameMessages.CREATED);
        this.game = game;
        this.player = player;
        this.setupHandlers();
        return this;
    }

    private async joinGameAsPlayer(options: JoinGameOptions): Promise<this> {
        this.socket.emit(TopLevelClientToServerMessages.JOIN_GAME, options);

        const {
             game, player, otherPlayers,
        } = await this.takeNext(SingleClientGameMessages.JOIN_SUCCESSFUL);
        this.game = game;
        this.player = player;
        this.otherPlayers = otherPlayers;
        this.setupHandlers();
        return this;
    }

    private handlePlayerJoined({ game, player }: { game: GameDTO, player: PlayerDTO }): void {
        this.game = game;
        this.otherPlayers.push(player);
        (this.eventHandlers.get(ClientEvent.PLAYER_JOINED) || []).forEach(handler => handler(player));
    }

    private handlePlayerLeft({ player: gonePlayer }: { player: PlayerDTO}): void {
        this.otherPlayers = this.otherPlayers.filter(existingPlayer => existingPlayer.id !== gonePlayer.id);
        (this.eventHandlers.get(ClientEvent.PLAYER_LEFT) || []).forEach(handler => handler(gonePlayer));
    }

    private handleGameStarted({ gameDefinition }: { gameDefinition: GameDefinitionDTO }): void {
        if (!this.game) {
            return;
        }
        this.game.runState = GameRunState.RUNNING_ROUND;
        this.gameDefinition = gameDefinition;
        (this.eventHandlers.get(ClientEvent.GAME_STARTED) || []).forEach(handler => handler(gameDefinition));
    }

    private handlePlayerResponse(res: { playerId: string }): void {
        (this.eventHandlers.get(ClientEvent.PLAYER_RESPONSE) || []).forEach(handler => handler(res));
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
            throw new ValidationError(result.validationError as string);
        }
        if (result.failure) {
            throw new Error(result.failure as string);
        }
        return result.success as ObjectOfAny;
    }

    private handlerToKeyedPromise<T>(keyName: string, eventName: string): Promise<{ [keyof: string]: T }> {
        return new Promise((resolve) => this.socket.once(eventName, (arg: any) => resolve({ [keyName]: arg })));
    }

    private setupHandlers() {
        this.socket.on(BroadcastGameMessages.PLAYER_JOINED, this.handlePlayerJoined.bind(this));
        this.socket.on(BroadcastGameMessages.PLAYER_DISCONNECTED, this.handlePlayerLeft.bind(this));
        this.socket.on(BroadcastGameMessages.STARTED, this.handleGameStarted.bind(this));
        this.socket.on(BroadcastRoundMessages.PLAYER_RESPONSE, this.handlePlayerResponse.bind(this));
    }

}
