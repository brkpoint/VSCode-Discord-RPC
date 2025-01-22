import { existsSync } from 'fs';
import { createConnection } from 'net';
import { globSync } from 'glob';
import { randomUUID } from 'crypto';

import { Logger } from './extension.logger';
import { LooseObject, addToObject } from './utils';

// RPCCommunication Class //
// Handles parsing messages, connecting, disconnecting and general communication between the code and discord.

class RPCCommunication {
    private isWebsocket: boolean;
    private connected: boolean = false;

    private socket: any;
    private websocket: any;

    private reciverHandler: (type: number, op: number, payload: any) => any;

    private cachingEnabled: boolean;
    private setCache: ((key: string, data: any) => void) | undefined;
    private getCache: (<T>(key: string) => T | undefined) | undefined;

    /**
     * @param {boolean} isWebsocket Is the connection throught a websocket.
     * @param {Function} reciverHandler Data reciver handler.
     * @param {boolean} cachingEnabled If caching is enabled, mostly used for caching paths. (default undefined)
     * @param {Function | undefined} cacheFunction Function used to cache. (default undefined)
     */
    constructor(
        isWebsocket: boolean,
        reciverHandler: (type: number, op: number, payload: any) => any,
        cachingEnabled: boolean,
        setCache: ((key: string, data: any) => any) | undefined,
        getCahce: (<T>(key: string) => T | undefined) | undefined,
    ) {
        this.isWebsocket = isWebsocket;

        this.reciverHandler = reciverHandler;

        this.cachingEnabled = cachingEnabled;
        this.setCache = setCache;
        this.getCache = getCahce;
    }

    /**
     * @description TODO
     */
    private reciveWebsocket(data: any): { op: number; payload: any } {
        return { op: 0, payload: null };
    }

    /**
     * @param {any} data Binary data input.
     * @description Decodes data and returns it.
     * @returns {object} Returns decoded data.
     */
    private reciveIpc(data: any): { op: number; payload: any } {
        const op = data.readInt32LE(0);
        const length = data.readInt32LE(4);
        const payload = JSON.parse(data.slice(8, 8 + length));

        return { op, payload };
    }

    /**
     * @param {number} type Type of data.
     * @param {any} data Binary data.
     * @description Gets the binary data, decodes it and passes it to the 'reciverHandler'.
     */
    recive(type: number, data: any) {
        let decoded: { op: number; payload: any };

        if (!this.websocket) {
            decoded = this.reciveIpc(data);
        } else {
            decoded = this.reciveWebsocket(data);
        }

        this.reciverHandler(type, decoded.op, decoded.payload);
    }

    /**
     * @description TODO
     */
    private sendWebsocket(op: number, payload: any) {}

    /**
     * @param {number} op Opcode.
     * @param {any} payload Data for discord.
     * @description Sends encrypted data with opcode to discord through IPC.
     */
    private sendIpc(op: number, payload: any) {
        const encoded = Buffer.from(JSON.stringify(payload));
        const header = Buffer.alloc(8);

        header.writeInt32LE(op, 0);
        header.writeInt32LE(encoded.length, 4);

        this.socket.write(Buffer.concat([header, encoded]));
    }

    /**
     * @param {number} op Opcode.
     * @param {any} payload Data for discord.
     * @description Send data to discord.
     */
    send(op: number, payload: any) {
        if (!this.connected) {
            Logger.warn(
                'Cannot send payload to socket when it is not connected.',
            );
            return;
        }

        if (this.isWebsocket) {
            this.sendWebsocket(op, payload);
            return;
        }

        this.sendIpc(op, payload);
    }

    /**
     * @param {string} path Path that will be cached.
     * @description Caches the path for later use.
     */
    private cacheIpcPath(path: string) {
        if (!this.cachingEnabled) {
            return;
        }

        if (!this.setCache) {
            return;
        }

        this.setCache('discordIpcPipePath', path);
    }

    /**
     * @description Gets the cached IPC path.
     * @returns {string | undefined} Path to IPC.
     */
    private getCachedIpcPath(): string | undefined {
        if (!this.cachingEnabled) {
            return;
        }

        if (!this.getCache) {
            return;
        }

        const path = this.getCache<string>('discordIpcPipePath');

        return path;
    }

    /**
     * @description Finds a path in the system files.
     */
    private searchForPath(): string | undefined {
        let path = undefined;

        if (process.platform === 'darwin') {
            path = '/private/var/folders/**/*discord-ipc-*';
        }

        if (!path) {
            return;
        }

        const results = globSync(path);

        if (results.length === 0) {
            return;
        }

        return results[0];
    }

    /**
     * @description Finds the path in the system or if it is already cached it skips finding it.
     * @returns {string | undefined} Path to the discord's IPC pipe.
     */
    private deepFindIpcPath(): string | undefined {
        const cachedPath = this.getCachedIpcPath();

        if (cachedPath && existsSync(cachedPath)) {
            return cachedPath;
        }

        const foundPath = this.searchForPath();

        if (!foundPath) {
            return;
        }

        this.cacheIpcPath(foundPath);

        return foundPath;
    }

    /**
     * @description Find IPC pipe path in known folders.
     * @returns {string | undefined} Path to the universal discord's IPC pipe.
     */
    private findIpcPath(): string | undefined {
        let ipcPath = process.platform === 'win32' ? '\\\\.\\pipe\\' : '/tmp/';
        const versions = ['discord-ipc-0', 'discord-ipc-1'];

        for (const version of versions) {
            if (!existsSync(ipcPath + version)) {
                continue;
            }

            return ipcPath + version;
        }

        return this.deepFindIpcPath();
    }

    /**
     * @param {string} applicationId
     * @descripton Tries to connect to the IPC pipe and if it does it returns a user promise.
     * @returns {Promise<any>} User data promise.
     */
    private async ipcConnect(applicationId: string): Promise<any> {
        const ipcPath = this.findIpcPath();

        if (!ipcPath) {
            return false;
        }

        const userData = await new Promise<any>((resolve, reject) => {
            this.socket = createConnection(ipcPath, () => {
                const payload = {
                    v: 1,
                    client_id: applicationId,
                };

                this.socket.once('data', (data: any) => {
                    const decoded = this.reciveIpc(data);

                    if (
                        decoded.op === 1 &&
                        decoded.payload.cmd === 'DISPATCH'
                    ) {
                        resolve(decoded.payload.data.user);
                        return;
                    }

                    reject();
                });

                this.socket.on('data', (data: any) => {
                    this.recive(0, data);
                });

                this.socket.on('error', (data: any) => {
                    this.recive(1, data);
                });

                this.socket.on('end', (data: any) => {
                    Logger.info('ICP disconnected from discord.');
                    this.reciverHandler(2, -1, -1);
                });

                this.sendIpc(0, payload);
            });
        });

        if (userData) {
            this.connected = true;
        }

        return userData;
    }

    /**
     * @descripton TODO
     */
    private async websocketConnect(applicationId: string): Promise<any> {
        return false;
    }

    /**
     * @param {string} applicationId
     * @descripton Tries to connect to discord and if it does it returns a user promise.
     * @returns {Promise<any>} User data promise.
     */
    async connect(applicationId: string): Promise<any> {
        if (!this.isWebsocket) {
            return await this.ipcConnect(applicationId);
        }

        return await this.websocketConnect(applicationId);
    }

    /**
     * @descripton Disconnects clinet from discord.
     */
    disconnect() {
        this.connected = false;

        if (!this.websocket) {
            this.socket.end();
            return;
        }
    }

    /**
     * @returns {boolean} Is client connected to discord.
     */
    isConnected(): boolean {
        return this.connected;
    }
}

// RPCButton Class //
// Button data for rpc.

export class RPCButton {
    private button: { label: string; url: string };

    /**
     * @param button Button data.
     */
    constructor(button: { label: string; url: string }) {
        this.button = button;
    }

    /**
     * @returns Returns the button data.
     */
    parse(): object {
        return this.button;
    }
}

// RPCData Class //
// Data for rpc in discord, handles parsing and standard data building functions.

export class RPCData {
    private name: string;
    private type: number;

    private title: string | undefined;
    private description: string | undefined;

    private timestampStart: number | undefined;
    private timestampEnd: number | undefined;

    private largeImage: string | undefined;
    private largeImageText: string | undefined;

    private smallImage: string | undefined;
    private smallImageText: string | undefined;

    private buttons: RPCButton[] = [];

    /**
     * @param {string} name Name of the RPC.
     * @param {type} type Type of the activity.
     */
    constructor(name: string, type: number = 0) {
        this.name = name;
        this.type = type;
    }

    /**
     * @param {LooseObject} activity Object to parse.
     * @description Adds the activity fields to the object if they are set.
     * @returns {LooseObject} Parsed object.
     */
    private parseActivity(activity: LooseObject): LooseObject {
        if (this.title && this.title.length >= 2) {
            addToObject(activity, ['details'], this.title);
        }

        if (this.description && this.description.length >= 2) {
            addToObject(activity, ['state'], this.description);
        }

        addToObject(activity, ['timestamps', 'start'], this.timestampStart);
        addToObject(activity, ['timestamps', 'end'], this.timestampEnd);

        addToObject(activity, ['assets', 'large_image'], this.largeImage);
        addToObject(activity, ['assets', 'large_text'], this.largeImageText);

        addToObject(activity, ['assets', 'small_image'], this.smallImage);
        addToObject(activity, ['assets', 'small_text'], this.smallImageText);

        return activity;
    }

    /**
     * @param {LooseObject} activity Object to parse.
     * @description Adds the button fields to the object if they are set.
     * @returns {LooseObject} Parsed object.
     */
    private parseButtons(activity: LooseObject): LooseObject {
        if (this.buttons.length === 0) {
            return activity;
        }

        let parsedButtons: object[] = [];

        for (const button of this.buttons) {
            parsedButtons.push(button.parse());
        }

        addToObject(activity, ['buttons'], parsedButtons);

        return activity;
    }

    /**
     * @description Parses the data into an object.
     * @returns {object} Parsed object.
     */
    parse(): object {
        let activity: LooseObject = {
            name: this.name,
            type: 0,
        };

        activity = this.parseActivity(activity);
        activity = this.parseButtons(activity);

        return activity;
    }

    /**
     * @param {string} value
     * @description Sets the title (aka details of the activity).
     * @returns {RPCData} Current class.
     */
    setTitle(value: string): RPCData {
        this.title = value;

        return this;
    }
    /**
     * @param {string} value
     * @description Sets the description (aka state of the activity).
     * @returns {RPCData} Current class.
     */
    setDescription(value: string): RPCData {
        this.description = value;

        return this;
    }

    /**
     * @param {number} value
     * @description Sets the start of the timestamp.
     * @returns {RPCData} Current class.
     */
    setTimestampStart(value: number): RPCData {
        this.timestampStart = value;

        return this;
    }
    /**
     * @param {number} value
     * @description Sets the end of the timestamp.
     * @returns {RPCData} Current class.
     */
    setTimestampEnd(value: number): RPCData {
        this.timestampEnd = value;

        return this;
    }

    /**
     * @param {string} value
     * @description Sets the large image ID.
     * @returns {RPCData} Current class.
     */
    setLargeImage(value: string): RPCData {
        this.largeImage = value;

        return this;
    }
    /**
     * @param {string} value
     * @description Sets the large image text.
     * @returns {RPCData} Current class.
     */
    setLargeImageText(value: string): RPCData {
        this.largeImageText = value;

        return this;
    }

    /**
     * @param {string} value
     * @description Sets the small image.
     * @returns {RPCData} Current class.
     */
    setSmallImage(value: string): RPCData {
        this.smallImage = value;

        return this;
    }
    /**
     * @param {string} value
     * @description Sets the small image text.
     * @returns {RPCData} Current class.
     */
    setSmallImageText(value: string): RPCData {
        this.smallImageText = value;

        return this;
    }

    /**
     * @param {RPCButton} button
     * @description Adds a button.
     * @returns {RPCData} Current class.
     */
    addButton(button: RPCButton): RPCData {
        this.buttons.push(button);

        return this;
    }
    /**
     * @param {RPCButton[]} buttons
     * @description Adds buttons.
     * @returns {RPCData} Current class.
     */
    addButtons(buttons: RPCButton[]): RPCData {
        this.buttons.concat(buttons);

        return this;
    }

    /**
     * @returns {string} Name.
     */
    getName(): string {
        return this.name;
    }
    /**
     * @returns {number} Type of the activity.
     */
    getType(): number {
        return this.type;
    }

    /**
     * @returns {string | undefined} Title.
     */
    getTitle(): string | undefined {
        return this.title;
    }
    /**
     * @returns {string | undefined} Description.
     */
    getDescription(): string | undefined {
        return this.description;
    }

    /**
     * @returns {number | undefined} Timestamp start.
     */
    getTimestampStart(): number | undefined {
        return this.timestampStart;
    }
    /**
     * @returns {number | undefined} Timestamp end.
     */
    getTimestampEnd(): number | undefined {
        return this.timestampEnd;
    }

    /**
     * @returns {string | undefined} Large image ID.
     */
    getLargeImage(): string | undefined {
        return this.largeImage;
    }
    /**
     * @returns {string | undefined} Large image text.
     */
    getLargeImageText(): string | undefined {
        return this.largeImageText;
    }

    /**
     * @returns {string | undefined} Small image ID.
     */
    getSmallImage(): string | undefined {
        return this.smallImage;
    }
    /**
     * @returns {string | undefined} Small image text.
     */
    getSmallImageText(): string | undefined {
        return this.smallImageText;
    }

    /**
     * @returns {RPCButton[]} All buttons.
     */
    getButtons(): RPCButton[] {
        return this.buttons;
    }
}

// RPCHandle Class //
// Handles connection with discord, handles updates and data.

export class RPCHandle {
    private readonly applicationId: string;

    private userData: any;

    private communication: RPCCommunication | undefined;
    private presenceLastUpdateObject: RPCData | undefined;

    private connectHandler: (handle: RPCHandle) => any;
    private disconnectHandler: (handle: RPCHandle) => any;
    private updateHandler: (handle: RPCHandle) => any;

    private updateInterval: any;
    private updateIntervalMS: number;

    private cachingEnabled: boolean;
    private setCache: ((key: string, data: any) => void) | undefined;
    private getCache: (<T>(key: string) => T | undefined) | undefined;

    /**
     * @param {string} applicationId ID for the application that contains all the images for RPC.
     * @param {Function} connectHandler Function is called when the RPC connects successfully.
     * @param {Function} disconnectHandler Function is called when the RPC disconnects.
     * @param {Function} updateHandler Function is called when the updateInterval updates.
     * @param {number} updateIntervalMS Time between updates in the milliseconds. (default 12_000)
     * @param {boolean} cachingEnabled Is caching enabled for the RPC. (default false)
     * @param {Function} setCache Function used for caching RPC paths and data. (default undefined)
     * @param {Function} getCache Function used for getting RPC paths and data cache. (default undefined)
     */
    constructor(
        applicationId: string,
        connectHandler: (handle: RPCHandle) => any,
        disconnectHandler: (handle: RPCHandle) => any,
        updateHandler: (handle: RPCHandle) => any,
        updateIntervalMS: number = 12_000,
        cachingEnabled = false,
        setCache: ((name: string, data: any) => void) | undefined = undefined,
        getCache: (<T>(name: string) => T | undefined) | undefined = undefined,
    ) {
        this.applicationId = applicationId;

        this.connectHandler = connectHandler;
        this.disconnectHandler = disconnectHandler;
        this.updateHandler = updateHandler;

        this.updateIntervalMS = updateIntervalMS;

        this.cachingEnabled = cachingEnabled;
        this.setCache = setCache;
        this.getCache = getCache;
    }

    /**
     * @description Creates a interval loop with 'updateIntervalMS'.
     */
    private createIntervalLoop() {
        this.updateInterval = setInterval(() => {
            Logger.log('RPC update.');
            this.updateHandler(this);
        }, this.updateIntervalMS);
    }

    /**
     * @description Tries to connect to discord using the 'RPCCommunication'.
     * @returns {Promise<boolean>} Did connect successfully.
     */
    private async tryToConnect(): Promise<boolean> {
        if (!this.communication) {
            Logger.warn(
                "Variable 'communitacion' is undentified, cannot connect.",
            );
            return false;
        }

        Logger.info('Connecting to discord...');
        let success = false;
        this.userData = await this.communication?.connect(this.applicationId);

        if (this.userData) {
            Logger.log('Connected! Setting up interval...');
            Logger.info('Connected user data: ', this.userData);

            success = true;

            this.connectHandler(this);
            this.updateHandler(this);
            this.createIntervalLoop();
        }

        return success;
    }

    /**
     * @param {number} type Type of the data.
     * @param {number} op Opcode.
     * @param {any} payload Payload of the data recived.
     * @description Handles the data recived from discord.
     */
    private handleData(type: number, op: number, payload: any) {
        Logger.info(`Recived opcode: ${op} and data: `, payload);
        switch (type) {
            case 1:
                Logger.error('Error occured: ', payload);
                return;
            case 2:
                this.disconnectHandler(this);
                return;
        }

        switch (op) {
            case 1:
                this.updatePresence();
                break;
            default:
                Logger.warn(`Unhandled event (opcode: ${op}): `, payload);
        }
    }

    /**
     * @param {boolean} websocket Is the connection a websocket connection.
     * @description Tries connect to discord, it tries 3 times before aborting.
     * @returns {Promise<boolean>} Did connect successfully.
     */
    async connect(websocket: boolean): Promise<boolean> {
        this.communication = new RPCCommunication(
            websocket,
            this.handleData,
            this.cachingEnabled,
            this.setCache,
            this.getCache,
        );

        let connected: boolean = await this.tryToConnect();

        for (let i = 1; i > 3; i++) {
            if (connected) {
                break;
            }

            await new Promise((f) => setTimeout(f, 3000 * i));

            Logger.info(`Trying to connect ${i} time...`);
            connected = await this.tryToConnect();
        }

        return connected;
    }

    /**
     * @param {number} updateIntervalMS Update interval in milliseconds. (default 12_000)
     * @description Updates the 'updateIntervalMS' and resets the interval loop.
     */
    reload(updateIntervalMS: number = 12_000) {
        this.updateIntervalMS = updateIntervalMS;

        clearInterval(this.updateInterval);
        this.createIntervalLoop();
        this.connectHandler(this);
    }

    /**
     * @description Disconnects from discord and removes the interval loop.
     */
    disconnect() {
        if (!this.communication) {
            Logger.warn(
                "Variable 'communitacion' is undentified, cannot connect.",
            );
            return;
        }

        Logger.log("Disconnected from discord's RPC.");
        this.communication.disconnect();
        clearInterval(this.updateInterval);
        this.disconnectHandler(this);
    }

    /**
     * @description Sends parsed payload to discord.
     */
    private updatePresence() {
        if (!this.communication) {
            Logger.warn('Cannot update presence when communication is closed.');
            return;
        }

        if (!this.presenceLastUpdateObject) {
            return;
        }

        const activity = this.presenceLastUpdateObject?.parse();
        const payload = {
            cmd: 'SET_ACTIVITY',
            nonce: randomUUID(),
            args: {
                pid: process.pid,
                activity: activity,
            },
        };

        this.communication.send(1, payload);
    }

    /**
     * @param {RPCData} rpcUpdateData The RPC data.
     * @description Sets 'presenceLastUpdateObject' and calls function 'updatePresence()'.
     */
    update(rpcUpdateData?: RPCData) {
        if (rpcUpdateData) {
            this.presenceLastUpdateObject = rpcUpdateData;
        }

        this.updatePresence();
    }

    /**
     * @returns {boolean} Is the client connected to discord.
     */
    isConnected(): boolean {
        if (!this.communication) {
            return false;
        }

        return this.communication.isConnected();
    }

    /**
     * @returns {string | undefined} User ID.
     */
    getUserId(): string | undefined {
        if (!this.communication) {
            Logger.warn(
                `Trying to get userId when RPC communication is not initalized.`,
            );
            return;
        }

        if (!this.communication?.isConnected()) {
            Logger.warn(`Trying to get userId when RPC is not connected.`);
            return;
        }

        if (!this.userData.id) {
            return;
        }

        return this.userData.id;
    }

    /**
     * @returns {string | undefined} Username.
     */
    getUsername(): string | undefined {
        if (!this.communication) {
            Logger.warn(
                `Trying to get username when RPC communication is not initalized.`,
            );
            return;
        }

        if (!this.communication.isConnected()) {
            Logger.warn(`Trying to get username when RPC is not connected.`);
            return;
        }

        if (!this.userData.username) {
            return;
        }

        return this.userData.username;
    }

    /**
     * @returns {string | undefined} User displayname.
     */
    getDisplayName(): string | undefined {
        if (!this.communication) {
            Logger.warn(
                `Trying to get display name when RPC communication is not initalized.`,
            );
            return;
        }

        if (!this.communication.isConnected()) {
            Logger.warn(
                `Trying to get display name when RPC is not connected.`,
            );
            return;
        }

        if (!this.userData.global_name) {
            return;
        }

        return this.userData.global_name;
    }
}
