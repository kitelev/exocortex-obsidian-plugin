"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
class LoggingService {
    static setVerbose(verbose) {
        this.isVerbose = verbose;
    }
    static debug(message, context) {
        if (this.isVerbose) {
            console.debug(`[Exocortex] ${message}`, context ?? '');
        }
    }
    static info(message, context) {
        // eslint-disable-next-line no-console
        console.log(`[Exocortex] ${message}`, context ?? '');
    }
    static warn(message, context) {
        console.warn(`[Exocortex] ${message}`, context ?? '');
    }
    static error(message, error) {
        console.error(`[Exocortex ERROR] ${message}`, error ?? '');
        if (error?.stack) {
            console.error(error.stack);
        }
    }
}
exports.LoggingService = LoggingService;
LoggingService.isVerbose = false;
