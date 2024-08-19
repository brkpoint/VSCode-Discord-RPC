import EventEmitter from "node:events";
class MyEmitter extends EventEmitter {}

// Discord RPC api
const discordRPC = require("discord-rpc");

// RPC
let rpc;
/* -- RPC activity object --
{
	details: "",
	state: "",
	startTimestamp,
	largeImageKey: "",
	largeImageText: "",
	smallImageKey: "",
	smallImageTest: "",
	instance: false,
}
*/

// Interval for updating RPC
let interval;

let clientId;

let config;

// Events stuff
const emitter = new MyEmitter();

const Events = {
    Error: "error",
    Ready: "ready",
    Stop: "stop",
    Reload: "reload",
    Update: "update",
};

function on(event, callback) {
    emitter.on(event, callback);
}

// Helper function
function createRPC() {
	rpc = new discordRPC.Client({ transport: 'ipc' });
    
    rpc.on("ready", () => {
        emitter.emit(Events.Ready, rpc);
		update();

		interval = setInterval(() => {
			update();
		}, config.intervalTime ?? 15_000);
	});

    rpc.login({ clientId: clientId }).catch((error) => emitter.emit(Events.Error, error));
}

// Initalize RPC
function init(options) {
    if (rpc) {
        console.error("Connection already initialized! - rpc.mjs");
        emitter.emit(Events.Error);
        return;
    }

    if (!options.clientId) {
        console.error("ID of the client wasnt set!");
        return;
    }

    config = options;
    clientId = options.clientId;

    discordRPC.register(clientId);

    createRPC();
}

// Reload connection
function reload(options) {
    if (!config.clientId) {
        console.error("ID of the client wasnt set!");
        return;
    }

    config = options;

    interval = null;

    createRPC();

    emitter.emit(Events.Reload, rpc);
}

// Stop connection
function stop() {
    if (!rpc) {
        console.error("Connection isnt initialized! - rpc.mjs");
        emitter.emit(Events.Error);
        return;
    }

    if (!interval) {
        return;
    }

    emitter.emit(Events.Stop);

    // Destroying the rpc
	rpc.destroy();
	rpc = null;

	// Removing the interval from running
	clearInterval(interval);
	interval = null;
}

// Update activity
function update() {
    if (!rpc) {
        console.error("Connection isnt initialized!");
        emitter.emit(Events.Error);
        return;
    }

    emitter.emit(Events.Update, rpc);
}

function getRPC() {
    return rpc;
}

export { init, reload, stop, update, on, getRPC, Events };
