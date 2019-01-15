import { createClientSocket } from "./util/create-connection";
import { Client } from '../../src/client/client';
import 'jest';

describe('connection handling', () => {

    let socket: SocketIOClient.Socket;
    let toDisconnect: SocketIOClient.Socket[] = [];

    beforeEach(() => {
        socket = createClientSocket();
        toDisconnect.push(socket);
    });

    afterEach(() => {
        toDisconnect.forEach(io => io.disconnect());
        toDisconnect = [];
    });

    it('will create a game', async () => {
        const {game, player, otherPlayers} = await Client.createAsHost(socket);
        expect(game!.code.length).toEqual(5);
        expect(game!.runState).toEqual('WAITING_FOR_PLAYERS_TO_JOIN');
        expect(player).not.toBeUndefined();
        expect(player!.name).toEqual('HOST');
        expect(player!.isHost).toBe(true);
        expect(player!.type).toEqual('OBSERVER');
        expect(otherPlayers).toHaveLength(0);
    });

    it('will allow players to join the game', async () => {
        const secondSocket = createClientSocket();
        toDisconnect.push(secondSocket);

        const host = await Client.createAsHost(socket);
        expect(host.otherPlayers).toEqual([]);

        const activeClient = await Client.joinGameAsPlayer(secondSocket, {
            playerName: 'new-player',
            gameCode: host.game!.code,
            observer: false,
        });

        if (!activeClient.game || !host.game || !activeClient.player || !host.player) {
            throw new Error('game or player was null on activeClient or host');
        }

        expect(activeClient.game.id).toEqual(host.game.id);
        expect(activeClient.otherPlayers).toHaveLength(1);
        expect(activeClient.otherPlayers[0].id).toEqual(host.player.id);
        expect(activeClient.player.name).toEqual('new-player');
        expect(activeClient.player.type).toEqual('ACTIVE_PLAYER');

        expect(host.otherPlayers).toHaveLength(1);
        expect(host.otherPlayers[0]!.id).toEqual(activeClient.player.id);
        expect(host.otherPlayers[0]!.name).toEqual('new-player');
    });

});
