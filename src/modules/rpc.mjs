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

// Config of RPC
let config = {
    clientId: null,
    options: null,
};

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

// Initalize RPC
function init(options) {
    if (rpc) {
        emitter.emit(Events.Error, "RPC already initialized!");
        return;
    }

    if (!options.clientId) {
        emitter.emit(Events.Error, "ID of the client wasnt set!");
        return;
    }

    config.clientId = options.clientId;
    delete options.clientId;
    config.options = options;

    discordRPC.register(config.clientId);

    createRPC();
}

// Reload connection
function reload(options) {
    if (!rpc) {
        emitter.emit(Events.Error, "RPC not initialized!");
        return;
    }

    delete options.clientId;
    config.options = options;

    interval = null;

    createRPC();

    emitter.emit(Events.Reload, rpc);
}

// Stop connection
function stop() {
    if (!rpc) {
        emitter.emit(Events.Error, "RPC already stopped!");
        return;
    }
    
	// Removing the interval from running
	clearInterval(interval);
	interval = null;
    
    // Destroying the rpc
	rpc.destroy();
	rpc = null;
    
    emitter.emit(Events.Stop);
}

// Update activity
function update() {
    if (!rpc) {
        emitter.emit(Events.Error, "RPC not initialized!");
        return;
    }

    emitter.emit(Events.Update, rpc);
}

function getRPC() {
    return rpc;
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

    rpc.login({ clientId: config.clientId }).catch((error) => emitter.emit(Events.Error, error));
}

export { init, reload, stop, update, on, getRPC, Events };
