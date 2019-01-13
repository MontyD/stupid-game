import { Socket, Server } from 'socket.io';
import { logger } from '../logger';
import { GameMessages } from '../models/messages/game';
import { Game } from '../models/entities/game';
import { Player } from '../models/entities/player';

export const createGame = async (socket: Socket, server: Server): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const game = await Game.generateHost();
    const hostPlayer = await Player.generateHostPlayer(game, socket.id);

    await game.addPlayer(hostPlayer);

    socket.join(game.id);
    server.to(game.id).emit(GameMessages.CREATED, {
        player: hostPlayer.toDTO(),
        game: game.toDTO(),
    });
};

interface JoinGameArgs { gameCode: string; playerName: string; observer: boolean; }
export const joinGame = async (socket: Socket, server: Server, ...args: any[]) => {
    const { gameCode, playerName, observer }: JoinGameArgs = args[0] || {};
    logger.info('joining game', gameCode, playerName, socket.id);

    const game = await Game.findByCode(gameCode);
    if (game === null) {
        throw new Error(`Could not find game with code ${gameCode}`);
    }

    const newPlayer = await Player.generatePlayer(game, playerName, socket.id, observer);
    await game.addPlayer(newPlayer);

    socket.join(game.id);
    server.to(game.id).emit(GameMessages.PLAYER_JOINED, {
        player: newPlayer.toDTO(),
        game: game.toDTO(),
    });
};

export const disconnectPlayer = async (socket: Socket, server: Server) => {
    logger.info('Disconnecting socket', socket.id);
    const player = await Player.findBySocketId(socket.id);
    if (!player) {
        return;
    }

    const game = await Game.findById(player.game);
    if (game) {
        await game.removePlayer(player);
    }

    server.to(player.game.toHexString()).emit(GameMessages.PLAYER_DISCONNECTED, {
        player: player.toDTO(),
        game: game ? game.toDTO() : null,
    });
};
