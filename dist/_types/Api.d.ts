/// <reference types="node" />
import http from 'http';
export type VihapiHandler = {
    handler: (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
        req: http.IncomingMessage;
    }) => Promise<void>;
    conditions?: ((req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & {
        req: http.IncomingMessage;
    }) => Promise<boolean>)[];
};
export type VihapiDescription = {
    [url: string]: VihapiHandler;
};
export default function api(description: VihapiDescription): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
export declare function normalizeURI(uri: string): string;
