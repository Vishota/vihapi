import http from 'http';
import { RecursivePartial } from './tools';

export type BasicVihapiHandler = {
    handler: (
        req: http.IncomingMessage,
        res: http.ServerResponse<http.IncomingMessage>
    ) => Promise<void>,
    conditions?: ((
        req: http.IncomingMessage,
        res: http.ServerResponse<http.IncomingMessage>
    ) => Promise<boolean>)[]
}
export type VihapiHandler = BasicVihapiHandler;
export type VihapiDescription = {
    [url: string]: VihapiHandler
}
export type VihapiOptions = RecursivePartial<{
    showLogs: {
        [code: number]: boolean,
        default: boolean
    },
    sendExceptionInfo: boolean,
    errorLogger: (error: HttpError) => any
}>
export class HttpError extends Error {
    private _info: { code: number, description: string, realError?: Error };
    constructor(code: number, description: string, realError?: Error) {
        super(code + ': ' + description);
        this._info = { code, description, realError };
    }
    get() { return this._info }
    get info() { return this._info }
}

export default function api(
    description: VihapiDescription,
    options: VihapiOptions = {
        showLogs: {
            500: true
        }
    }
) {
    const server = http.createServer(async (req, res) => {
        // sending, logging and displaying HttpError information
        function handleHttpError(error: HttpError) {
            res.statusCode = error.info.code;
            res.write(JSON.stringify({
                'errorCode': error.info.code,
                'message': error.info.code + ': ' + error.info.description + (options.sendExceptionInfo ? ' | ' + error.info.realError : '')
            }));
            if (options.errorLogger) {
                options.errorLogger(error);
            }
        }

        // catching HttpErrors
        try {
            // catching runtime errors (in handlers, conditions, etc)
            try {
                let normalizedURI = req.url ? normalizeURI(req.url) : '';
                // checking if uri exists
                if (description[normalizedURI]) {
                    const handler = description[normalizedURI] as BasicVihapiHandler;
                    if (handler.conditions && handler.conditions?.length) {
                        let conditions: Promise<any>[] = [];
                        handler.conditions?.forEach(condition => {
                            conditions.push(condition(req, res));
                        });
                        await Promise.all(conditions);
                    }
                    await handler.handler(req, res);
                }
                // if uri doesn't exist, throwing 404 error
                else {
                    throw new HttpError(404, normalizedURI + ' not found 404');
                }
            } catch (e: any) {
                // if e is HttpError, throwing it again
                if (e.info) {
                    throw e;
                }
                // else creating 500 error
                throw new HttpError(500, options.sendExceptionInfo ? '' + e : 'internal server error', e);
            }
        } catch (e) {
            handleHttpError(e as HttpError);
        }
        finally {
            res.end();
        }
    });
    return server;
}

export function normalizeURI(uri: string) {
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