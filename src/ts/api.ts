import { sleep, Future } from "./async.ts";

const apiBaseUrl = "https://semaphore.miravalier.com/api";
const websocketUrl = "wss://semaphore.miravalier.com/api/ws";


export async function request(method: string, endpoint: string, body: any = null) {
    const request: RequestInit = {
        method: method,
    };
    if (body !== null) {
        request.headers = {"Content-Type": "application/json"};
        request.body = JSON.stringify(body);
    }

    const response = await fetch(`${apiBaseUrl}${endpoint}`, request);
    if (response.status != 200) {
        throw {
            code: response.status,
            text: await response.text(),
        }
    }

    return await response.json();
}


export type TurnServerInfo = {
    hostname: string;
    username: string;
    password: string;
};


export async function getTurnServerInfo(): Promise<TurnServerInfo> {
    return await request("GET", "/turn-server");
}


export type WebsocketMessage = {
    id?: number;
    type: string;
    data: any;
};

export type WebsocketHandler = (message: WebsocketMessage) => void;

export type PendingMessage = {
    message: WebsocketMessage;
    future: Future<WebsocketMessage>;
}

export class WebsocketService {
    localId: number;
    socket: WebSocket | null;
    running: boolean;
    pendingMessages: {[id: number]: PendingMessage};
    messageHandlers: WebsocketHandler[];

    constructor() {
        this.localId = 0;
        this.socket = null;
        this.running = true;
        this.pendingMessages = {};
        this.messageHandlers = [];
        this.worker();
    }

    nextLocalId(): number {
        this.localId += 1;
        return this.localId;
    }

    rawSend(message: WebsocketMessage) {
        if (this.socket !== null) {
            try {
                this.socket.send(JSON.stringify(message));
            } catch {}
        }
    }

    addMessageHandler(handler: WebsocketHandler) {
        this.messageHandlers.push(handler);
    }

    removeMessageHandler(handler: WebsocketHandler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index !== -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    async send(message: WebsocketMessage): Promise<WebsocketMessage> {
        message.id = this.nextLocalId();
        const pendingMessage: PendingMessage = {
            message: message,
            future: new Future(),
        };
        this.pendingMessages[message.id] = pendingMessage;
        this.rawSend(message);
        return await pendingMessage.future;
    }

    async worker() {
        while (this.running) {
            if (this.socket === null) {
                console.log("Websocket Connecting ...");
                this.socket = new WebSocket(websocketUrl);
                this.socket.onmessage = ev => {
                    const message: WebsocketMessage = JSON.parse(ev.data);
                    if (message.type === "ping") {
                        return;
                    }
                    if (message.id) {
                        const pendingMessage = this.pendingMessages[message.id];
                        if (pendingMessage) {
                            delete this.pendingMessages[message.id];
                            pendingMessage.future.resolve(message);
                        }
                    } else {
                        for (const messageHandler of this.messageHandlers) {
                            messageHandler(message);
                        }
                    }
                }
                this.socket.onclose = () => {
                    this.socket = null;
                }
                this.socket.onerror = () => {
                    this.socket = null;
                }
                this.socket.onopen = () => {
                    console.log("Websocket Connected");
                    for (const pendingMessage of Object.values(this.pendingMessages)) {
                        this.rawSend(pendingMessage.message);
                    }
                }
            }
            await sleep(5000);
            this.rawSend({type: "ping", data: null});
        }
    }

    close() {
        this.running = false;
        if (this.socket !== null) {
            this.socket.close();
        }
        this.socket = null;
        for (const pendingMessage of Object.values(this.pendingMessages)) {
            pendingMessage.future.reject("WebsocketService closed");
        }
    }
}
