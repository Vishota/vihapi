import http from 'http';

export type VihapiHandler = {
    handler: (req:http.IncomingMessage,res:http.ServerResponse<http.IncomingMessage>)=>Promise<void>,
    conditions?: ((req:http.IncomingMessage,res:http.ServerResponse<http.IncomingMessage>)=>Promise<boolean>)[]
}
export type VihapiDescription = {
    [url:string]: VihapiHandler
}

export default function api(description:VihapiDescription) {
    const server = http.createServer(async (req,res)=>{
        try {
            let normalizedURI = req.url ? normalizeURI(req.url) : '';
            if(description[normalizedURI]) {
                if(description[normalizedURI].conditions && description[normalizedURI].conditions?.length) {
                    let conditions:Promise<any>[] = [];
                    description[normalizedURI].conditions?.forEach(condition=>{
                        conditions.push(condition(req, res));
                    });
                    await Promise.all(conditions);
                }
                await description[normalizedURI].handler(req, res);
            }
            else {
                res.statusCode = 404;
                res.write(JSON.stringify({'errorCode':404,'message': normalizeURI(req.url ? req.url : '') + ' not found 404'}));
            }
        } catch(e) {
            res.statusCode = 500;
            res.write(JSON.stringify({'errorCode':500,'message':e}));
        }
        finally {
            res.end();
        }
    });
    return server;
}

export function normalizeURI(uri:string) {
    let normalized = uri.replace(/\/+/g, '/').toLowerCase();
    const index = normalized.indexOf('?');
    if (index !== -1) {
        normalized = normalized.slice(0, index);
    }
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    if(uri.startsWith('/')) {
        normalized = normalized.slice(1);
    }
    return normalized;
}