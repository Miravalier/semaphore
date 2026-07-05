export class Future<T> {
    promise: Promise<T>;
    resolve_callback: (value: T | PromiseLike<T>) => void;
    reject_callback: (reason?: any) => void;

    constructor() {
        const self = this;
        this.resolve_callback = null as any;
        this.reject_callback = null as any;
        this.promise = new Promise((resolve, reject) => {
            self.resolve_callback = resolve;
            self.reject_callback = reject;
        });
    }

    resolve(value: T | PromiseLike<T>) {
        this.resolve_callback(value);
    }

    reject(reason?: any) {
        this.reject_callback(reason);
    }

    then(onfulfilled?: (value: T) => T | PromiseLike<T>,
        onrejected?: (reason: any) => PromiseLike<never>) {
        return this.promise.then(onfulfilled, onrejected);
    }
}

export class LockHandle {
    releaseCallback: (value: null) => void;

    constructor(releaseCallback: (value: null) => void) {
        this.releaseCallback = releaseCallback;
    }

    release() {
        this.releaseCallback(null);
    }
}

export class Lock {
    uuid: string;

    constructor() {
        this.uuid = crypto.randomUUID();
    }

    async acquire(): Promise<LockHandle> {
        const { promise: lockReleasedPromise, resolve: releaseLockResolve } = Promise.withResolvers<null>();
        const { promise: lockObtainedPromise, resolve: obtainLockResolve } = Promise.withResolvers<null>();
        navigator.locks.request(this.uuid, async (lock) => {
            obtainLockResolve(null);
            await lockReleasedPromise;
        });
        await lockObtainedPromise;
        return new LockHandle(releaseLockResolve);
    }

    async acquireAndRun(callback: () => Promise<void>) {
        const handle = await this.acquire();
        try {
            await callback();
        } finally {
            handle.release();
        }
    }
}

export async function sleep(timeoutMs: number) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
}

export const WS_PING = 'ping';
export const WS_PONG = 'pong';
export const WS_ALERT = 'alert';

export type WebsocketMessage = {
    type: string;
    data: any;
};

export type WebsocketHandler = (message: WebsocketMessage) => void;

export class SocketSubscriber {
    url: string;
    socket: WebSocket | null;
    on_message: WebsocketHandler;

    constructor(url: string, on_message: WebsocketHandler) {
        this.url = url;
        this.socket = null;
        this.on_message = on_message;
        this.worker();
    }

    send(message: WebsocketMessage) {
        if (this.socket !== null) {
            try {
                this.socket.send(JSON.stringify(message));
            } catch {}
        }
    }

    async worker() {
        while (true) {
            if (this.socket === null) {
                console.log("Websocket Connecting ...");
                this.socket = new WebSocket(this.url);
                this.socket.onmessage = ev => {
                    this.on_message(JSON.parse(ev.data));
                }
                this.socket.onclose = () => {
                    this.socket = null;
                }
                this.socket.onerror = () => {
                    this.socket = null;
                }
                this.socket.onopen = () => {
                    console.log("Websocket Connected");
                }
            }
            await sleep(5000);
            this.send({type: WS_PING, data: null});
        }
    }
}
