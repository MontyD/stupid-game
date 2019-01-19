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
        expect(otherPlayers).toHaveLength(0);
    });

    it('will allow players to join the game', async () => {
        const playerJoinedListener = jest.fn();
        const secondSocket = createClientSocket();
        toDisconnect.push(secondSocket);

        const host = await Client.createAsHost(socket);
        host.onPlayerJoined(playerJoinedListener);
        expect(host.otherPlayers).toEqual([]);

        const activeClient = await Client.joinGameAsPlayer(secondSocket, {
            playerName: 'new-player',
            gameCode: host.game!.code,
        });

        if (!activeClient.game || !host.game || !activeClient.player || !host.player) {
            throw new Error('game or player was null on activeClient or host');
        }

        expect(activeClient.game.id).toEqual(host.game.id);
        expect(activeClient.otherPlayers).toHaveLength(1);
        expect(activeClient.otherPlayers[0].id).toEqual(host.player.id);
        expect(activeClient.player.name).toEqual('new-player');

        expect(host.otherPlayers).toHaveLength(1);
        expect(host.otherPlayers[0]!.id).toEqual(activeClient.player.id);
        expect(host.otherPlayers[0]!.name).toEqual('new-player');

        expect(playerJoinedListener).toHaveBeenCalledWith(host.otherPlayers[0]);
    });

    it('will handle players disconnecting', async (done) => {
        const secondSocket = createClientSocket();
        const host = await Client.createAsHost(socket);
        const activePlayerClient = await Client.joinGameAsPlayer(secondSocket, {
            playerName: 'i-will-leave',
            gameCode: host.game!.code,
        });

        host.onPlayerLeft((player: any) => {
            expect(player.id).toEqual(activePlayerClient.player!.id);
            expect(host.otherPlayers).toEqual([]);
            done();
        });

        secondSocket.disconnect();
    });

    it('will limit the number of players to 12', async () => {
        const host = await Client.createAsHost(socket);
        const players = [];

        let i = 0;
        while (i++ < 12) {
            const newPlayerSocket = createClientSocket();
            const newPlayer = await Client.joinGameAsPlayer(newPlayerSocket, {
                playerName: `player ${i}`,
                gameCode: host.game!.code,
            });
            toDisconnect.push(newPlayerSocket);
            players.push(newPlayer);
        }

        try {
            const newPlayerSocket = createClientSocket();
            toDisconnect.push(newPlayerSocket);
            await Client.joinGameAsPlayer(newPlayerSocket, {
                playerName: 'one player too many',
                gameCode: host.game!.code,
            });
            // should never be here, should throw
            expect(true).toBe(false);
        } catch (exception) {
            expect(exception).toMatchSnapshot();
        }
    });

});
