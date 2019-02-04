import 'jest';
import { createClientSocket } from './util/create-connection';
import { Client } from '../../src/client/client';
import { pause } from '../../src/utils/async';

describe('draw round', () => {

    let toDisconnect: SocketIOClient.Socket[] = [];
    let currentClients: Client[] = [];
    let hostClient: Client;
    let activePlayerClients: Client[];

    const createSocket = (): SocketIOClient.Socket => {
        const newSocket = createClientSocket();
        toDisconnect.push(newSocket);
        return newSocket;
    };

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

        hostClient = currentClients.find(client => !!(client.player && client.player.isHost))!;
        activePlayerClients = currentClients.filter(client => !!(client.player && !client.player.isHost));
    };

    const progressToPrompts = async () => {
        await hostClient.startGame();
        await Promise.all(currentClients.map(client => client.instructionsComplete()));
    };

    beforeEach(async () => {
        toDisconnect.forEach(socket => socket.disconnect());
        toDisconnect = [];
        currentClients = [];

        await setupGame();
    });

    it('will wait for instructions to progress and give unique prompts', async () => {
        const [firstClient, ...otherPlayerClients] = activePlayerClients;
        await firstClient.startGame();

        // host should get null prompt
        expect(await hostClient.instructionsComplete()).toEqual(null);

        const responses = await Promise.all([
            (async () => {
                await pause(1000);
                return firstClient.instructionsComplete();
            })(),
            ...otherPlayerClients.map(client => client.instructionsComplete()),
        ]);

        const promptsText = responses.map(response => response && response.text);
        expect(new Set(promptsText).size).toEqual(promptsText.length);
        expect(promptsText).toHaveLength(activePlayerClients.length);

        responses.forEach(prompt => {
            expect(prompt).not.toBeNull();
            expect(prompt!.type).toEqual('DRAW');
            expect(prompt!.timeoutMs).toEqual(30000);
        });
    });

    it('will allow continue the round after prompts are completed', async () => {
        await progressToPrompts();
    });

});
