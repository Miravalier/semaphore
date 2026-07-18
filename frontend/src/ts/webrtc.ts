import * as Api from "./api";
import { sleep } from "./async";


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

    let pendingCandidates = [];
    let remoteDescriptionSet = false;

    const signalService = new SignalService(peerConnId, websocketService, async (message: SignalingMessage) => {
        if (message.type === "candidate") {
            if (remoteDescriptionSet) {
                await peerConnection.addIceCandidate(message.data);
            } else {
                console.log("Candidate too early!");
                pendingCandidates.push(message.data);
            }
        } else if (message.type === "offer") {
            console.log("Offer Received", peerConnId);
            if (peerConnection.signalingState != "stable") {
                if (!polite) return;
                await Promise.all([
                    peerConnection.setLocalDescription({type: "rollback"}),
                    peerConnection.setRemoteDescription(message.data),
                ]);
            } else {
                await peerConnection.setRemoteDescription(message.data);
            }
            remoteDescriptionSet = true;
            for (const candidate of pendingCandidates) {
                await peerConnection.addIceCandidate(candidate);
            }
            pendingCandidates = [];
            await peerConnection.setLocalDescription(await peerConnection.createAnswer());
            signalService.send({
                type: "answer",
                data: peerConnection.localDescription,
            });
        } else if (message.type === "answer") {
            console.log("Answer Received", peerConnId);
            try {
                await peerConnection.setRemoteDescription(message.data);
            } catch {
                console.log("Received duplicate answer - possibly in response to a duplicate offer that was delayed.");
                return;
            }
            remoteDescriptionSet = true;
            for (const candidate of pendingCandidates) {
                await peerConnection.addIceCandidate(candidate);
            }
            pendingCandidates = [];
        }
    });

    peerConnection.onicecandidate = async (event) => {
        signalService.send({
            type: "candidate",
            data: event.candidate,
        });
    };

    peerConnection.onnegotiationneeded = async () => {
        const offer = await peerConnection.createOffer();
        if (peerConnection.signalingState != "stable") {
            // A remote offer may have been received while we were creating the offer,
            // in which case we need to stop with our offer
            return;
        }
        await peerConnection.setLocalDescription(offer);
        while (peerConnection.connectionState != "connected") {
            await signalService.send({
                type: "offer",
                data: peerConnection.localDescription,
            });
            await sleep(100);
        }
    }

    peerConnection.addEventListener("peerclose", () => {
        signalService.close();
    });

    return peerConnection;
}
