import { Socket, Server } from 'socket.io';
import { logger } from '../logger';
import { BroadcastGameMessages, SingleClientGameMessages } from '../models/messages/game';
import { Game } from '../models/entities/game';
import { Player } from '../models/entities/player';
import { retryWithErrorHandling } from '../utils/error-handling';

export const createGame = async (socket: Socket, server: Server): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const game = await Game.generateHost();
    const player = await Player.generateHostPlayer(game, socket.id);

    await game.addPlayer(player);

    socket.join(game.id);
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
    socket.join(game.id);
    server.to(game.id).emit(BroadcastGameMessages.PLAYER_JOINED, responseBody);
    socket.emit(SingleClientGameMessages.JOIN_SUCCESSFUL, { otherPlayers,  ...responseBody });
};

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
