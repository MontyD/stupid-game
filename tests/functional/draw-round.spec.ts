import 'jest';
import { readFile } from 'fs';
import { promisify } from 'util';
import { createClientSocket } from './util/create-connection';
import { Client } from '../../src/client/client';
import { pause } from '../../src/utils/async';

const asyncReadFile = promisify(readFile);

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

    it('will continue the round after image prompts are completed', async () => {
        await progressToPrompts();

        await Promise.all(activePlayerClients.map(async (client, index) => {
            const image = await asyncReadFile(`./tests/functional/assets/draw-images/${index}.png`);
            return client.sendImageResponse(image);
        }));

        await Promise.all(activePlayerClients.map(client => client.waitForNextPrompt()));
    });

    fit('will reject bad data being sent as drawings', async () => {
        const [firstPlayerClient, ...otherPlayerClients] = activePlayerClients;
        const sevenZipFile = await asyncReadFile('./tests/functional/assets/draw-images/invalid-file.7z');
        await progressToPrompts();

        const assertImageDataRejected = async (
            fileContent: ArrayBuffer | string, rejectMessage: string
        ): Promise<boolean> => {
            try {
                await firstPlayerClient.sendImageResponse(fileContent as ArrayBuffer);
                return false;
            } catch (err) {
                expect(err!.message).toEqual(rejectMessage);
            }
            return true;
        };

        expect(await assertImageDataRejected('this-is-a-dodgy-string', 'Image data must be a buffer')).toBeTruthy();
        expect(await assertImageDataRejected(sevenZipFile, 'Data must be a valid image')).toBeTruthy();

        await Promise.all([firstPlayerClient, ...otherPlayerClients].map(async (client, index) => {
            const image = await asyncReadFile(`./tests/functional/assets/draw-images/${index}.png`);
            await client.sendImageResponse(image);
        }));

        await Promise.all(activePlayerClients.map(client => client.waitForNextPrompt()));
    });

});
