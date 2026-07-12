import * as Api from "./api";


export type SignalingMessage = {
    connId?: string;
    type: "candidate" | "offer" | "answer";
    data: any;
};


export type MessageHandler = (message: SignalingMessage) => void;
export type TrackHandler = (stream: MediaStream, track: MediaStreamTrack) => void;


export class SignalService {
    peerConnId: string;
    websocketService: Api.WebsocketService;
    messageHandlers: MessageHandler[];
    parentHandler: Api.WebsocketHandler;

    constructor(peerConnId: string, websocketService: Api.WebsocketService) {
        this.peerConnId = peerConnId;
        this.websocketService = websocketService;
        this.messageHandlers = [];
        this.parentHandler = (message: Api.WebsocketMessage) => {
            const subMessage: SignalingMessage = message.data;
            if (subMessage.connId != this.peerConnId) {
                return;
            }
            for (const subHandler of this.messageHandlers) {
                subHandler(subMessage);
            }
        }
        this.websocketService.addMessageHandler(this.parentHandler);
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
        message.connId = this.peerConnId;
        await this.websocketService.send({type: Api.WebsocketMessageType.SIGNALING, data: message});
    }

    close() {
        this.websocketService.removeMessageHandler(this.parentHandler);
    }
}


export async function createPeerConnection(caller: boolean, peerConnId: string, websocketService: Api.WebsocketService, trackHandler: TrackHandler): Promise<RTCPeerConnection> {
    const turnServerInfo = await Api.getTurnServerInfo();
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
    peerConnection.ontrack = (event) => {
        trackHandler(event.streams[0], event.track);
    }

    const pendingCandidates = [];
    let remoteDescriptionSet = false;

    const signalService = new SignalService(peerConnId, websocketService);
    signalService.addMessageHandler(async (message: SignalingMessage) => {
        if (message.type === "candidate") {
            if (remoteDescriptionSet) {
                peerConnection.addIceCandidate(message.data);
            } else {
                pendingCandidates.push(message.data);
            }
        } else if (message.type === "offer") {
            await peerConnection.setRemoteDescription(message.data);
            await peerConnection.setLocalDescription(await peerConnection.createAnswer());
            signalService.send({
                type: "answer",
                data: peerConnection.localDescription,
            });
            remoteDescriptionSet = true;
            for (const candidate of pendingCandidates) {
                peerConnection.addIceCandidate(candidate);
            }
        } else if (message.type === "answer") {
            await peerConnection.setRemoteDescription(message.data);
            remoteDescriptionSet = true;
            for (const candidate of pendingCandidates) {
                peerConnection.addIceCandidate(candidate);
            }
        }
    });

    peerConnection.onicecandidate = async (event) => {
        signalService.send({
            type: "candidate",
            data: event.candidate,
        });
    };

    if (caller) {
        peerConnection.onnegotiationneeded = async () => {
            await peerConnection.setLocalDescription(await peerConnection.createOffer());
            signalService.send({
                type: "offer",
                data: peerConnection.localDescription,
            });
        };
    }

    peerConnection.addEventListener("peerclose", () => {
        signalService.close();
    });

    return peerConnection;
}
