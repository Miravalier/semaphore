import { WebsocketService, WebsocketMessage, getTurnServerInfo } from "./api";


export type SignalingMessage = {
    connId?: string;
    type: "candidate" | "offer" | "answer";
    data: any;
};


export type MessageHandler = (message: SignalingMessage) => void;


export class SignalService {
    connId: string;
    websocketService: WebsocketService;
    messageHandlers: MessageHandler[];

    constructor(connId: string, websocketService: WebsocketService) {
        this.connId = connId;
        this.websocketService = websocketService;
        this.websocketService.addMessageHandler(this.onParentMessage);
    }

    onParentMessage(message: WebsocketMessage) {
        const subMessage: SignalingMessage = message.data;
        if (subMessage.connId != this.connId) {
            return;
        }
        for (const subHandler of this.messageHandlers) {
            subHandler(subMessage);
        }
    }

    addMessageHandler(handler: MessageHandler) {
        this.messageHandlers.push(handler);
    }

    removeMessageHandler(handler: MessageHandler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index !== -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    async send(message: SignalingMessage) {
        message.connId = this.connId;
        await this.websocketService.send({type: "signaling", data: message});
    }

    close() {
        this.websocketService.removeMessageHandler(this.onParentMessage);
    }
}


export async function createPeerConnection(connId: string, websocketService: WebsocketService, localStream?: MediaStream, remoteTarget?: HTMLVideoElement): Promise<RTCPeerConnection> {
    const turnServerInfo = await getTurnServerInfo();
    const iceConfiguration = {
        iceServers: [
            {
                urls: `turn:${turnServerInfo.hostname}`,
                username: turnServerInfo.username,
                credential: turnServerInfo.password,
            },
        ],
    };

    const peerConnection = new RTCPeerConnection(iceConfiguration);

    const signalService = new SignalService(connId, websocketService);
    signalService.addMessageHandler(async (message: SignalingMessage) => {
        if (message.type === "candidate") {
            peerConnection.addIceCandidate(message.data);
        } else if (message.type === "offer") {
            await peerConnection.setRemoteDescription(message.data);
            await peerConnection.setLocalDescription(await peerConnection.createAnswer());
            signalService.send({
                type: "answer",
                data: peerConnection.localDescription,
            });
        } else if (message.type === "answer") {
            await peerConnection.setRemoteDescription(message.data);
        }
    });

    peerConnection.onicecandidate = async (event) => {
        signalService.send({
            type: "candidate",
            data: event.candidate,
        });
    };

    peerConnection.onnegotiationneeded = async () => {
        await peerConnection.setLocalDescription(await peerConnection.createOffer());
        signalService.send({
            type: "offer",
            data: peerConnection.localDescription,
        });
    };

    peerConnection.ontrack = (event) => {
        if (remoteTarget) {
            remoteTarget.srcObject = event.streams[0];
        }
    };

    if (localStream) {
        for (const track of localStream.getTracks()) {
            peerConnection.addTrack(track, localStream);
        }
    }

    peerConnection.addEventListener("peerclose", () => {
        signalService.close();
    });

    return peerConnection;
}
