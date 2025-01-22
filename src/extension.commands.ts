import { Cacher } from './extension.caching';
import { Config } from './extension.config';
import { ExtensionElements } from './extension.elements';
import { Logger } from './extension.logger';
import { RPCHandle } from './rpc';

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @param {Function} connectRpc
 * @description Starts rpc, if it is connected, it wont connect.
 */
export async function handleStartRpcCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
    connectRpc: Function,
) {
    if (handle.isConnected()) {
        return;
    }

    elements.get('statusItem').text = '$(sync~spin) RPC Connecting...';

    await connectRpc();
}

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @description Stops rpc connection, if it isnt connected it wont do anything.
 */
export async function handleStopRpcCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
) {
    if (!handle.isConnected()) {
        return;
    }

    handle.disconnect();
}

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @description Reloads rpc if it is connected.
 */
export async function handleReloadRpcCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
) {
    elements.get('statusItem').text = '$(sync~spin) Reloading...';

    Config.load();

    await new Promise((f) => setTimeout(f, 1500));

    handle.reload(Config.get().extension.settings.updateTimeInterval * 1000);

    Logger.log('Reloaded RPC.');
}

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @param {Cacher} cacher
 * @description Clears extensions cache.
 */
export async function handleClearAllCacheCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
    cacher: Cacher,
) {
    cacher.clearAllCache();
}

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @param {Function} connectRpc
 * @description If there is a connection between rpc and extension it will reload the rpc, if there isnt it will start rpc.
 */
export async function handleStatusItemCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
    connectRpc: Function,
) {
    if (!handle.isConnected()) {
        await handleStartRpcCommand(elements, handle, connectRpc);
        return;
    }

    await handleReloadRpcCommand(elements, handle);
}
