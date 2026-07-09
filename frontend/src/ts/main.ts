import * as Elements from "./elements";
import * as Sources from "./sources";
import { createPeerConnection } from "./webrtc";
import * as Api from "./api";


type RoomPeer = {
    connId: string;
    connection: RTCPeerConnection;
    videoElement: HTMLVideoElement;
};

let localConnId: string = null as any;
const roomId = "default";
const websocketService: Api.WebsocketService = new Api.WebsocketService();
const peers: {[connId: string]: RoomPeer} = {};


window.addEventListener("load", async () => {
    console.log("Semaphore App Loading ...");

    websocketService.addMessageHandler(async (message) => {
        if (message.type === Api.WebsocketMessageType.CONNECT) {
            const connectData: Api.ConnectData = message.data;
            localConnId = connectData.connId;
        }
    });
    websocketService.init();

    const viewport = document.body.appendChild(Elements.div("viewport"));
    const startButton = viewport.appendChild(Elements.button(["connect"], "Connect", async () => {
        startButton.disabled = true;
        startButton.classList.add("hidden");

        const localStream = await Sources.getVideoStream();

        const localVideoElement = viewport.appendChild(document.createElement("video"));
        localVideoElement.autoplay = true;
        localVideoElement.srcObject = localStream;
        localVideoElement.onloadedmetadata = () => {
            localVideoElement.play();
        };

        websocketService.addMessageHandler(async (message) => {
            if (message.type === Api.WebsocketMessageType.CONNECT) {
                for (const [connId, roomPeer] of Object.entries(peers)) {
                    roomPeer.videoElement.remove();
                    roomPeer.connection.close();
                    roomPeer.connection.dispatchEvent(new CustomEvent("peerclose"));
                    delete peers[connId];
                }
                await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
            } else if (message.type === Api.WebsocketMessageType.PEER_JOIN) {
                const peerJoinData: Api.PeerJoinData = message.data;
                if (peerJoinData.connId == localConnId) {
                    return;
                }
                const remoteVideoElement = viewport.appendChild(document.createElement("video"));
                remoteVideoElement.autoplay = true;
                remoteVideoElement.onloadedmetadata = () => {
                    remoteVideoElement.play();
                };
                const peerConnection = await createPeerConnection(localConnId > peerJoinData.connId, peerJoinData.connId, websocketService, localStream, remoteVideoElement);
                peers[peerJoinData.connId] = {connId: peerJoinData.connId, connection: peerConnection, videoElement: remoteVideoElement};
            } else if (message.type === Api.WebsocketMessageType.PEER_DROP) {
                const peerDropData: Api.PeerDropData = message.data;
                if (peerDropData.connId == localConnId) {
                    return;
                }
                const roomPeer = peers[peerDropData.connId];
                if (!roomPeer) {
                    return;
                }
                roomPeer.videoElement.remove();
                roomPeer.connection.close();
                roomPeer.connection.dispatchEvent(new CustomEvent("peerclose"));
                delete peers[peerDropData.connId];
            }
        });
        await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
    }));

    console.log("Semaphore App Loaded");
});
