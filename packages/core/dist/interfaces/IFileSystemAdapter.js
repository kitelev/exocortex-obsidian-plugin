"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAlreadyExistsError = exports.FileNotFoundError = void 0;
class FileNotFoundError extends Error {
    constructor(path) {
        super(`File not found: ${path}`);
        this.name = "FileNotFoundError";
    }
}
exports.FileNotFoundError = FileNotFoundError;
class FileAlreadyExistsError extends Error {
    constructor(path) {
        super(`File already exists: ${path}`);
        this.name = "FileAlreadyExistsError";
    }
}
exports.FileAlreadyExistsError = FileAlreadyExistsError;
