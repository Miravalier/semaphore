import * as Api from "./api";


export type SignalingMessage = {
    connId?: string;
    description?: any;
    candidate?: any;
};


export type MessageHandler = (message: SignalingMessage) => void;
export type TrackHandler = (stream: MediaStream, track: MediaStreamTrack) => void;


export class SignalService {
    peerConnId: string;
    websocketService: Api.WebsocketService;
    subHandler: MessageHandler;
    parentHandler: Api.WebsocketHandler;

    constructor(peerConnId: string, websocketService: Api.WebsocketService, handler: MessageHandler) {
        this.peerConnId = peerConnId;
        this.websocketService = websocketService;
        this.subHandler = handler;
        this.parentHandler = (message: Api.WebsocketMessage) => {
            const subMessage: SignalingMessage = message.data;
            if (subMessage.connId != this.peerConnId) {
                return;
            }
            this.subHandler(subMessage);
        }
        this.websocketService.addMessageHandler(this.parentHandler);
    }

    async send(message: SignalingMessage) {
        message.connId = this.peerConnId;
        await this.websocketService.send({type: Api.WebsocketMessageType.SIGNALING, data: message});
    }

    close() {
        this.websocketService.removeMessageHandler(this.parentHandler);
    }
}


export async function createPeerConnection(polite: boolean, peerConnId: string, websocketService: Api.WebsocketService, trackHandler: TrackHandler): Promise<RTCPeerConnection> {
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
    console.log("Peer Conn State", peerConnId, peerConnection.connectionState);
    peerConnection.onconnectionstatechange = () => {
        console.log("Peer Conn State", peerConnId, peerConnection.connectionState);
    }

    let ignoreOffer = false;
    let isSettingRemoteAnswerPending = false;
    let makingOffer = false;

    const signalService = new SignalService(peerConnId, websocketService, async (message: SignalingMessage) => {
        const {candidate, description} = message;
        if (description) {
            const readyForOffer = !makingOffer && (peerConnection.signalingState === "stable" || isSettingRemoteAnswerPending);
            const offerCollision = description.type === "offer" && !readyForOffer;
            ignoreOffer = !polite && offerCollision;
            if (ignoreOffer) {
                return;
            }
            isSettingRemoteAnswerPending = description.type === "answer";
            await peerConnection.setRemoteDescription(description);
            isSettingRemoteAnswerPending = false;
            if (description.type === "offer") {
                await peerConnection.setLocalDescription();
                signalService.send({ description: peerConnection.localDescription });
            }
        } else if (candidate) {
            try {
                await peerConnection.addIceCandidate(candidate);
            } catch (err) {
                if (!ignoreOffer) {
                    throw err;
                }
            }
        }
    });

    // Both send the PEER READY notification and wait for the other peer's notification
    await websocketService.send({type: Api.WebsocketMessageType.PEER_READY, data: {connId: peerConnId}});

    peerConnection.onicecandidate = async (event) => {
        signalService.send({ candidate: event.candidate });
    };

    peerConnection.onnegotiationneeded = async () => {
        try {
            makingOffer = true;
            await peerConnection.setLocalDescription();
            await signalService.send({ description: peerConnection.localDescription });
        } finally {
            makingOffer = false;
        }
    }

    peerConnection.addEventListener("peerclose", () => {
        signalService.close();
    });

    return peerConnection;
}
