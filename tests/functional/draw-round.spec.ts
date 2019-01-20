import 'jest';
import { createClientSocket } from './util/create-connection';
import { Client } from '../../src/client/client';

describe('draw round', () => {

    let toDisconnect: SocketIOClient.Socket[] = [];
    let currentClients: Client[] = [];

    const createSocket = (): SocketIOClient.Socket => {
        const newSocket = createClientSocket();
        toDisconnect.push(newSocket);
        return newSocket;
    };

    beforeEach(() => {
        toDisconnect.forEach(socket => socket.disconnect());
        toDisconnect = [];
        currentClients = [];
    });

    const setupGame = async (numberOfPlayers: number = 4) => {
        const host = await Client.createAsHost(createSocket());
        currentClients.push(host);
        let i = 0;
        while (i++ < numberOfPlayers) {
            const player = await Client.joinGameAsPlayer(createSocket(), {
                playerName: `player ${i}`,
                gameCode: host.game!.code,
            });
            currentClients.push(player);
        }
    };

    it('will wait for instructions to progress', async () => {
        await setupGame();
        await currentClients[0].startGame();
    });

});
