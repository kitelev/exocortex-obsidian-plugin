import { Logger } from "./Logger";
import { ILogger } from "./ILogger";

export class LoggerFactory {
  static create(context: string): ILogger {
    return new Logger(context);
  }
}
