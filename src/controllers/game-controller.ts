import { Socket, Server } from 'socket.io';
import { logger } from '../logger';
import { BroadcastGameMessages, SingleClientGameMessages, ClientToServerGameMessages } from '../models/messages/game';
import { Game } from '../models/entities/game';
import { Player } from '../models/entities/player';
import { retryWithErrorHandling } from '../utils/error-handling';
import { handleError } from '../router';
import { GameDefinition } from '../models/entities/game-definition';

const attachListenersAndJoinGame = (server: Server, socket: Socket, gameId: string) => {
    socket.join(gameId);
    socket.on(ClientToServerGameMessages.START, handleError(socket, async () => {
        await startGame(server, socket, gameId);
    }));
};

export const createGame = async (socket: Socket, server: Server): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const game = await Game.generateHost();
    const player = await Player.generateHostPlayer(game, socket.id);

    await game.addPlayer(player);

    attachListenersAndJoinGame(server, socket, game.id);
    server.to(game.id).emit(BroadcastGameMessages.CREATED, {
        player,
        game,
    });
};

export interface JoinGameOptions { gameCode: string; playerName: string; }
export const joinGame = async (socket: Socket, server: Server, jointArgs: JoinGameOptions) => {
    const { gameCode, playerName }: JoinGameOptions = jointArgs;
    logger.info('joining game', gameCode, playerName, socket.id);

    const game = await Game.findByCode(gameCode);
    const player = await Player.generatePlayer(game, playerName, socket.id);
    const otherPlayers = await Player.findAllByGame(game);

    await game.addPlayer(player);

    const responseBody = { player, game };
    attachListenersAndJoinGame(server, socket, game.id);
    server.to(game.id).emit(BroadcastGameMessages.PLAYER_JOINED, responseBody);
    socket.emit(SingleClientGameMessages.JOIN_SUCCESSFUL, { otherPlayers,  ...responseBody });
};

export const startGame = async (server: Server, socket: Socket, gameId: string) => {
    logger.info(`Starting game ${gameId}`);

    const game = await Game.get(gameId);
    await game.start();

    const gameDefinition = await GameDefinition.generate(game);
    server.send(BroadcastGameMessages.STARTED, { gameDefinition });
};

// TODO handle disconnect during game
export const disconnectPlayer = async (socket: Socket, server: Server) => {
    logger.info('Disconnecting socket', socket.id);
    const player = await Player.findBySocketId(socket.id);
    if (!player) {
        return;
    }

    // retry because of version conflicts
    const game = await retryWithErrorHandling(async () => {
        const existingGame = await Game.findById(player.game);
        if (existingGame) {
            await existingGame.removePlayer(player);
        }
        return existingGame;
    }, 20);

    server.to(player.game.toHexString()).emit(BroadcastGameMessages.PLAYER_DISCONNECTED, {
        player,
        game,
    });
};
