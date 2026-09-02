import { existsSync } from 'fs';
import { createConnection } from 'net';
import { globSync } from 'glob';
import { randomUUID } from 'crypto';

/**
 * REMOTE PROCESS COMMUNICATION
 *
 * Wraper around IPC and WebSocket connections to discord.
 */
class RPC {
    private isWebsocket: boolean;
    private connected: boolean = false;

    private socket: any;
    private websocket: any;

    private reciverHandler: (type: number, op: number, payload: any) => any;

    /**
     * @param {boolean} isWebsocket Is the connection throught a websocket.
     * @param {Function} reciverHandler Data reciver handler.
     */
    constructor(
        isWebsocket: boolean,
        reciverHandler: (type: number, op: number, payload: any) => any,
    ) {
        this.isWebsocket = isWebsocket;
        this.reciverHandler = reciverHandler;
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
            return;
        }

        if (this.isWebsocket) {
            this.sendWebsocket(op, payload);
            return;
        }

        this.sendIpc(op, payload);
    }

    /**
     * @description Finds a path in the system files.
     */
    private searchForPath(): string | undefined {
        let path = undefined;

        if (process.platform === 'darwin') {
            path = '/private/var/folders/**/*discord-ipc-*';
        }

        if (process.platform === 'linux') {
            const xdgRuntimeDir = process.env.XDG_RUNTIME_DIR;

            const candidates = [
                xdgRuntimeDir ? `${xdgRuntimeDir}/discord-ipc-*` : undefined,
                xdgRuntimeDir
                    ? `${xdgRuntimeDir}/app/com.discordapp.Discord/discord-ipc-*`
                    : undefined, // flatpak
                '/run/user/*/discord-ipc-*',
                '/run/user/*/snap.discord/discord-ipc-*', // snap
            ].filter((p): p is string => p !== undefined);

            for (const candidate of candidates) {
                const results = globSync(candidate);

                if (results.length > 0) {
                    return results[0];
                }
            }

            return undefined;
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
        const foundPath = this.searchForPath();

        if (!foundPath) {
            return;
        }

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
                    throw new Error('IPC Connection failed', { cause: data });
                });

                this.socket.on('end', (data: any) => {
                    console.log('ICP disconnected from discord.');
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

/**
 * ACTIVITY BUTTON
 *
 * Button wraper for discord's activity.
 */
export class ActivityButton {
    private label: string | undefined;
    private url: string | undefined;

    constructor() {}

    /**
     *
     * @param {string} label Button's label.
     * @description Sets the button's label.
     * @returns {ActivityButton}
     */
    setLabel(label: string): ActivityButton {
        this.label = label;
        return this;
    }

    /**
     *
     * @param {string} url Button's URL.
     * @description Sets the button's URL.
     * @returns {ActivityButton}
     */
    setUrl(url: string): ActivityButton {
        this.url = url;
        return this;
    }

    /**
     * @returns {string | undefined} Button's label.
     */
    getLabel(): string | undefined {
        return this.label;
    }

    /**
     * @returns {string | undefined} Button's URL.
     */
    getUrl(): string | undefined {
        return this.url;
    }

    /**
     * @returns {object} Returns the button data.
     */
    getAsObject(): object {
        return {
            ...(this.label !== undefined && { label: this.label }),
            ...(this.url !== undefined && { url: this.url }),
        };
    }
}

/**
 * ACTIVITY TYPE
 *
 * Wraper around discord's number system of activity types.
 */
export enum ActivityType {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM = 4,
    COMPETING = 5,
}

/**
 * ACTIVITY OBJECT
 *
 * Wraper for objects coming from activity (sent to discord).
 */
interface ActivityObject {
    name: string;
    type: ActivityType;
    details?: string;
    state?: string;
    start?: number;
    end?: number;
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
    buttons?: { label?: string; url?: string }[];
}

/**
 * ACTIVITY
 *
 * Handles creation of activity data and it's parsing.
 */
export class Activity {
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

    private buttons: ActivityButton[] = [];

    /**
     * @param {string} name Name of the activity.
     * @param {type} type Type of the activity.
     */
    constructor(name: string, type: ActivityType = 0) {
        this.name = name;
        this.type = type;
    }

    /**
     * @description Parses all buttons to objects.
     * @returns {object} Parsed object.
     */
    private buttonsAsObjects(): { label?: string; url?: string }[] {
        return this.buttons.map((button) => button.getAsObject());
    }

    /**
     * @description Parses the data into an object.
     * @returns {ActivityObject} Parsed object.
     */
    getAsObject(): ActivityObject {
        const activity: ActivityObject = {
            name: this.name,
            type: this.type,
        };

        if (this.title !== undefined && this.title!.length >= 2) {
            activity.details = this.title;
        }
        if (this.description !== undefined && this.description!.length >= 2) {
            activity.state = this.description;
        }
        if (this.timestampStart !== undefined) {
            activity.start = this.timestampStart;
        }
        if (this.timestampEnd !== undefined) {
            activity.end = this.timestampEnd;
        }
        if (this.largeImage !== undefined && this.largeImage!.length >= 2) {
            activity.large_image = this.largeImage;
        }
        if (
            this.largeImageText !== undefined &&
            this.largeImageText!.length <= 2
        ) {
            activity.large_text = this.largeImageText;
        }
        if (this.smallImage !== undefined && this.smallImage!.length >= 2) {
            activity.small_image = this.smallImage;
        }
        if (
            this.smallImageText !== undefined &&
            this.smallImageText!.length <= 2
        ) {
            activity.small_text = this.smallImageText;
        }
        if (this.buttons.length > 0) {
            activity.buttons = this.buttonsAsObjects();
        }

        return activity;
    }

    /**
     * @param {string} value
     * @description Sets the title (aka details of the activity).
     * @returns {Activity} Current class.
     */
    setTitle(value: string): Activity {
        this.title = value;
        return this;
    }

    /**
     * @param {string} value
     * @description Sets the description (aka state of the activity).
     * @returns {Activity} Current class.
     */
    setDescription(value: string): Activity {
        this.description = value;
        return this;
    }

    /**
     * @param {number} value
     * @description Sets the start of the timestamp.
     * @returns {Activity} Current class.
     */
    setTimestampStart(value: number): Activity {
        this.timestampStart = value;
        return this;
    }

    /**
     * @param {number} value
     * @description Sets the end of the timestamp.
     * @returns {Activity} Current class.
     */
    setTimestampEnd(value: number): Activity {
        this.timestampEnd = value;
        return this;
    }

    /**
     * @param {string} value
     * @description Sets the large image ID.
     * @returns {Activity} Current class.
     */
    setLargeImage(value: string): Activity {
        this.largeImage = value;
        return this;
    }

    /**
     * @param {string} value
     * @description Sets the large image text.
     * @returns {Activity}
     */
    setLargeImageText(value: string): Activity {
        this.largeImageText = value;
        return this;
    }

    /**
     * @param {string} value
     * @description Sets the small image.
     * @returns {Activity}
     */
    setSmallImage(value: string): Activity {
        this.smallImage = value;
        return this;
    }

    /**
     * @param {string} value
     * @description Sets the small image text.
     * @returns {Activity}
     */
    setSmallImageText(value: string): Activity {
        this.smallImageText = value;
        return this;
    }

    /**
     * @param {ActivityButton[]} buttons
     * @description Adds buttons.
     * @returns {Activity}
     */
    addButtons(buttons: ActivityButton[]): Activity {
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
     * @returns {ActivityType} Type of the activity.
     */
    getType(): ActivityType {
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
    getButtons(): ActivityButton[] {
        return this.buttons;
    }
}

/**
 * REMOTE PROCESS COMMUNICATION
 *
 * Handes connection with discord (updates and data parsing)
 */
export class RPCHandle {
    private readonly applicationId: string;

    private userData: any;

    private communication: RPC | undefined;
    private presenceLastUpdateObject: Activity | undefined;

    private connectHandler: (handle: RPCHandle) => any;
    private disconnectHandler: (handle: RPCHandle) => any;
    private updateHandler: (handle: RPCHandle) => any;

    private updateInterval: any;
    private updateIntervalMS: number;

    /**
     * @param {string} applicationId ID for the application that contains all the images for RPC.
     * @param {Function} connectHandler Function is called when the RPC connects successfully.
     * @param {Function} disconnectHandler Function is called when the RPC disconnects.
     * @param {Function} updateHandler Function is called when the updateInterval updates.
     * @param {number} updateIntervalMS Time between updates in the milliseconds. (default 12_000)
     */
    constructor(
        applicationId: string,
        connectHandler: (handle: RPCHandle) => any,
        disconnectHandler: (handle: RPCHandle) => any,
        updateHandler: (handle: RPCHandle) => any,
        updateIntervalMS: number = 12_000,
    ) {
        this.applicationId = applicationId;

        this.connectHandler = connectHandler;
        this.disconnectHandler = disconnectHandler;
        this.updateHandler = updateHandler;

        this.updateIntervalMS = updateIntervalMS;
    }

    /**
     * @description Creates a interval loop with 'updateIntervalMS'.
     */
    private createIntervalLoop() {
        this.updateInterval = setInterval(() => {
            this.updateHandler(this);
        }, this.updateIntervalMS);
    }

    /**
     * @description Tries to connect to discord using the 'RPC'.
     * @returns {Promise<boolean>} Did connect successfully.
     */
    private async tryToConnect(): Promise<boolean> {
        if (!this.communication) {
            throw new Error('Communication not created.');
        }

        let success = false;
        this.userData = await this.communication?.connect(this.applicationId);

        if (this.userData) {
            console.log('Discord connected!');

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
        switch (type) {
            case 1:
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
                break;
        }
    }

    /**
     * @param {boolean} websocket Is the connection a websocket connection.
     * @description Tries connect to discord, it tries 3 times before aborting.
     * @returns {Promise<boolean>} Did connect successfully.
     */
    async connect(websocket: boolean): Promise<boolean> {
        this.communication = new RPC(websocket, this.handleData);

        try {
            let connected: boolean = await this.tryToConnect();

            for (let i = 1; i > 3; i++) {
                if (connected) {
                    break;
                }

                await new Promise((f) => setTimeout(f, 3000 * i));

                connected = await this.tryToConnect();
            }

            return connected;
        } catch (err) {
            throw err;
        }
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
            return;
        }

        console.log('Discord disconnected.');
        this.communication.disconnect();
        clearInterval(this.updateInterval);
        this.disconnectHandler(this);
    }

    /**
     * @description Sends parsed payload to discord.
     */
    private updatePresence() {
        if (!this.communication) {
            return;
        }

        if (!this.presenceLastUpdateObject) {
            return;
        }

        const activity = this.presenceLastUpdateObject.getAsObject();
        const payload = {
            cmd: 'SET_ACTIVITY',
            nonce: randomUUID(),
            args: {
                pid: process.pid,
                activity: activity,
            },
        };

        // console.log(activity);

        this.communication.send(1, payload);
    }

    /**
     * @param {Activity} activity The RP data.
     * @description Sets 'presenceLastUpdateObject' and calls function 'updatePresence()'.
     */
    update(activity: Activity) {
        if (activity) {
            this.presenceLastUpdateObject = activity;
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
            return;
        }

        if (!this.communication?.isConnected()) {
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
            return;
        }

        if (!this.communication.isConnected()) {
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
            return;
        }

        if (!this.communication.isConnected()) {
            return;
        }

        if (!this.userData.global_name) {
            return;
        }

        return this.userData.global_name;
    }
}
