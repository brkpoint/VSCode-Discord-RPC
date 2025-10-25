import { Config } from '@/extension/config';

// Type of log.
enum LogType {
    log = 0,
    info = 1,
    warn = 2,
    error = 3,
}

/*--------------*/
/* LOGGER CLASS */
/*--------------*/
// Custom logger that doesnt log specific types of logs.

export class Logger {
    private static logs: string[] = [];

    /**
     * @param {boolean} parse Should be parsed.
     * @param {LogType} logType Type of log to parse into the message.
     * @param {any} msg Message to parse.
     * @description Parses the message.
     */
    private static parse(parse: boolean, logType: LogType, msg: any) {
        if (!parse) {
            return msg;
        }

        const name = Config.get().extension.name;
        const logTypeString = LogType[logType].toUpperCase();

        const maxLength = 5;
        const spaces = ' '.repeat(maxLength - logTypeString.length);

        const msgParsed = `${name} : ${logTypeString}${spaces}  -  ${msg}`;

        return msgParsed;
    }

    /**
     * @param {boolean} parse Should it parse the message.
     * @param {LogType} logType Type of log to print.
     * @param {any} msg Message to log.
     * @description Checks if logging is enabled and if 'logType' is equal to the one that we dont allow to log. Then proceedes to call the function 'send()'.
     */
    private static sendMessage(parse: boolean, logType: LogType, msg: any) {
        const message = this.parse(parse, logType, msg);

        this.logs.push(message);

        if (!Config.get().extension.debug) {
            return;
        }

        switch (logType) {
            case LogType.error:
                console.log(message);
                break;

            default:
                console.log(message);
        }
    }

    /**
     * @param {LogType} logType Type of log to print.
     * @param {any} message Message to log.
     * @description Checks if the message is an object and if it is, it disables the parsing. Then proceedes to call the 'sendMessage' function.
     */
    private static sendParsedMessage(logType: LogType, message: any) {
        if (typeof message === 'object') {
            if (Config.get().extension.debug) {
                return;
            }

            this.sendMessage(false, logType, message);
            return;
        }

        this.sendMessage(true, logType, message);
    }

    /**
     * @description All logs from current session (not saved).
     * @returns {string[]} All logs from the start of the extension.
     */
    static getLogs(): string[] {
        return this.logs;
    }

    /**
     * @description All logs from current session (not saved).
     * @returns {string} All logs from the start of the extension but as a string (separeted by '\n').
     */
    static getLogsAsString(): string {
        return this.logs.join('\n');
    }

    /**
     * @param {...any} messages List of messages to log.
     * @description Normal log to the console.
     */
    static log(...messages: any) {
        for (const message of messages) {
            this.sendParsedMessage(LogType.log, message);
        }
    }

    /**
     * @param {...any} messages List of messages to log.
     * @description Info log to console (more detailed use, is disabled).
     */
    static info(...messages: any) {
        for (const message of messages) {
            this.sendParsedMessage(LogType.info, message);
        }
    }

    /**
     * @param {...any} messages List of messages to log..
     * @description Warns of potential issues (mostly used when the issue is not going to crash the app).
     */
    static warn(...messages: any) {
        for (const message of messages) {
            this.sendParsedMessage(LogType.warn, message);
        }
    }

    /**
     * @param {...any} messages List of messages to log.
     * @description Spits out errors.
     */
    static error(...messages: any) {
        for (const message of messages) {
            this.sendParsedMessage(LogType.error, message);
        }
    }
}
