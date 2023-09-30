"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeURI = void 0;
const http_1 = __importDefault(require("http"));
function api(description) {
    const server = http_1.default.createServer((req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        let normalizedURI = req.url ? normalizeURI(req.url) : '';
        if (description[normalizedURI]) {
            if (description[normalizedURI].conditions && ((_a = description[normalizedURI].conditions) === null || _a === void 0 ? void 0 : _a.length)) {
                let conditions = [];
                (_b = description[normalizedURI].conditions) === null || _b === void 0 ? void 0 : _b.forEach(condition => {
                    conditions.push(condition(req, res));
                });
                yield Promise.all(conditions);
            }
            yield description[normalizedURI].handler(req, res);
            res.end();
        }
        else {
            res.statusCode = 404;
            res.write(normalizeURI(req.url ? req.url : '') + ' not found 404');
            res.end();
        }
    }));
    return server;
}
exports.default = api;
function normalizeURI(uri) {
    let normalized = uri.replace(/\/+/g, '/').toLowerCase();
    const index = normalized.indexOf('?');
    if (index !== -1) {
        normalized = normalized.slice(0, index);
    }
    if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    if (uri.startsWith('/')) {
        normalized = normalized.slice(1);
    }
    return normalized;
}
exports.normalizeURI = normalizeURI;
