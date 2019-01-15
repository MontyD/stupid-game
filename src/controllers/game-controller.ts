import { Socket, Server } from 'socket.io';
import { logger } from '../logger';
import { BroadcastGameMessages, SingleClientGameMessages } from '../models/messages/game';
import { Game, GameType } from '../models/entities/game';
import { Player } from '../models/entities/player';
import { retryWithErrorHandling } from '../utils/error-handling';

export const createGame = async (socket: Socket, server: Server): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const game = await Game.generateHost();
    const hostPlayer = await Player.generateHostPlayer(game, socket.id);

    await game.addPlayer(hostPlayer);

    socket.join(game.id);
    server.to(game.id).emit(BroadcastGameMessages.CREATED, {
        player: hostPlayer.toDTO(),
        game: game.toDTO(),
    });
};

export interface JoinGameOptions { gameCode: string; playerName: string; observer: boolean; }
export const joinGame = async (socket: Socket, server: Server, ...args: any[]) => {
    const { gameCode, playerName, observer }: JoinGameOptions = args[0] || {};
    logger.info('joining game', gameCode, playerName, socket.id);

    const game = await Game.findByCode(gameCode);
    if (game === null) {
        throw new Error(`Could not find game with code ${gameCode}`);
    }

    const newPlayer = await Player.generatePlayer(game, playerName, socket.id, observer);
    const otherPlayers = (await Player.findAllByGame(game)).map(player => player.toDTO());

    await game.addPlayer(newPlayer);

    const responseBody = {
        player: newPlayer.toDTO(),
        game: game ? game.toDTO() : null,
    };

    socket.join(game.id);
    server.to(game.id).emit(BroadcastGameMessages.PLAYER_JOINED, responseBody);
    socket.emit(SingleClientGameMessages.JOIN_SUCCESSFUL, { otherPlayers, ...responseBody });
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
    }, 2);

    server.to(player.game.toHexString()).emit(BroadcastGameMessages.PLAYER_DISCONNECTED, {
        player: player.toDTO(),
        game: game ? game.toDTO() : null,
    });
};
