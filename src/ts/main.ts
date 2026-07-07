import * as Elements from "./elements";
import { getScreenShare } from "./shim";
import { createPeerConnection } from "./webrtc";
import { WebsocketService } from "./api";


type RoomPeer = {
    connId: string;
    connection: RTCPeerConnection;
    videoElement: HTMLVideoElement;
};

type PeerJoinData = {
    connId: string;
};

type PeerDropData = {
    connId: string;
};

const websocketService: WebsocketService = new WebsocketService();
const peers: {[connId: string]: RoomPeer} = {};


window.addEventListener("load", async () => {
    console.log("Semaphore App Loading ...");

    const viewport = document.body.appendChild(Elements.div("viewport"));
    viewport.appendChild(Elements.h1([], "Semaphore")).style.textAlign = 'center';

    const startButton = viewport.appendChild(Elements.button([], "Start", async () => {
        const screenShareStream = await getScreenShare();

        startButton.disabled = true;

        const localVideoElement = viewport.appendChild(document.createElement("video"));
        localVideoElement.autoplay = true;
        localVideoElement.srcObject = screenShareStream;
        localVideoElement.onloadedmetadata = () => {
            localVideoElement.play();
        };

        websocketService.addMessageHandler(async (message) => {
            if (message.type === "peerJoin") {
                const peerJoinData: PeerJoinData = message.data;
                const remoteVideoElement = viewport.appendChild(document.createElement("video"));
                remoteVideoElement.autoplay = true;
                remoteVideoElement.onloadedmetadata = () => {
                    remoteVideoElement.play();
                };
                const peerConnection = await createPeerConnection(peerJoinData.connId, websocketService, screenShareStream, remoteVideoElement);
                peers[peerJoinData.connId] = {connId: peerJoinData.connId, connection: peerConnection, videoElement: remoteVideoElement};
            } else if (message.type === "peerDrop") {
                const peerDropData: PeerDropData = message.data;
                const roomPeer = peers[peerDropData.connId];
                roomPeer.videoElement.remove();
                roomPeer.connection.close();
                roomPeer.connection.dispatchEvent(new CustomEvent("peerclose"));
                delete peers[peerDropData.connId];
            }
        });
    }));

    console.log("Semaphore App Loaded");
});
