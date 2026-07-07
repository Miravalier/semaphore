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
