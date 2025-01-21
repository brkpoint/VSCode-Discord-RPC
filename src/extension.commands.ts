import { Config } from './extension.config';
import { ExtensionElements } from './extension.elements';
import { Logger } from './extension.logger';
import { RPCHandle } from './rpc';

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @param {Function} startRpc
 * @description Starts rpc, if it is connected, it wont connect.
 */
export async function handleStartRpcCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
    startRpc: Function,
) {
    if (handle.isConnected()) {
        return;
    }

    elements.get('barItem').text = '$(sync~spin) RPC Connecting...';

    await startRpc();
}

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @param {Function} startRpc
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
 * @param {Function} startRpc
 * @description Reloads rpc if it is connected.
 */
export async function handleReloadRpcCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
) {
    elements.get('barItem').text = '$(sync~spin) Reloading...';

    await new Promise((f) => setTimeout(f, 1500));

    handle.reload(Config.get().extension.settings.updateTimeInterval * 1000);

    Logger.log('Reloaded RPC.');
}

/**
 * @param {ExtensionElements} elements
 * @param {RPCHandle} handle
 * @param {Function} startRpc
 * @description If there is a connection between rpc and extension it will reload the rpc, if there isnt it will start rpc.
 */
export async function handleStatusItemCommand(
    elements: ExtensionElements,
    handle: RPCHandle,
    startRpc: Function,
) {
    if (!handle.isConnected()) {
        await handleStartRpcCommand(elements, handle, startRpc);
        return;
    }

    await handleReloadRpcCommand(elements, handle);
}
