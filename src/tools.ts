import { IncomingMessage } from "http";

export type RecursivePartial<T> = {
    [P in keyof T]?:
    // array elements
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    // functions
    T[P] extends Function ? T[P] :
    // objects
    T[P] extends object | undefined ? RecursivePartial<T[P]> :
    // others
    T[P];
};

export async function getRequestBody(req: IncomingMessage) {
    let body = '';
    let load: Function = () => { throw 'load() undefined' }
    let loaded = new Promise(resolve => {
        load = resolve
    });
    if (req.closed) throw 'Trying to get closed response body';
    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () => {
        load();
    });
    await loaded;
    return body;
}
export async function extractBodyData<const T extends readonly string[]>(
    req: IncomingMessage,
    required: T
): Promise<Record<T[number], any>> {
    const body = JSON.parse(await getRequestBody(req));
    let data: any = {};
    required.forEach(r => {
        if (body[r]) {
            data[r] = body[r];
        }
        else {
            throw `Required parameter "${r}" was not provided`;
        }
    })
    return data as Record<T[number], any>;
}