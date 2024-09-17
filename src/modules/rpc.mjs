import EventEmitter from "node:events";
class MyEmitter extends EventEmitter {}

Promise.timeout = function(promise, timeoutInMilliseconds){
    return Promise.race([
        promise, 
        new Promise(function(resolve, reject){
            setTimeout(function() {
                reject("timeout");
            }, timeoutInMilliseconds);
        })
    ]);
};

// Discord RPC api
const discordRPC = require("discord-rpc");

// RPC
let rpc;

// Interval for updating RPC
let interval;

// Times timeouts occured
let timeouts = 0;
let timeoutInterval;

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

async function setActivity(activity) {
    const promise = rpc.setActivity(activity);

    await Promise.timeout(promise, 2000).catch((err) => {
        if (err !== "timeout") {
            emitter.emit(Events.Error, err);
            return;
        }

        emitter.emit(Events.Error, new Error("RPC_CONNECTION_TIMEOUT"));

        stop();

        timeoutInterval = setInterval(() => require('dns').resolve('www.google.com', (err) => {
            // Checking if we can connect to the internet and if we tried less then 3 times
            if (!err && timeouts < 3) {
                // Each try makes the delay bigger
                setTimeout(() => createRPC(), 8000 * timeouts);
                clearInterval(timeoutInterval);
            }
        }), 2000);

        timeouts++;
    });
}

function getRPC() {
    return rpc;
}

// Helper function
async function createRPC() {
    console.log("Creating RPC...");

	rpc = new discordRPC.Client({ transport: 'ipc' });
    
    rpc.on("ready", () => {
        timeouts = 0;

        emitter.emit(Events.Ready, rpc);
        
        update();
        
		interval = setInterval(() => {
            update();
		}, config.intervalTime ?? 15_000);
	});

    await rpc.login({ clientId: config.clientId }).catch((error) => emitter.emit(Events.Error, error));
}

export { init, reload, stop, update, on, setActivity, getRPC, Events };
