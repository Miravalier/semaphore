import * as Elements from "./elements";
import * as Sources from "./sources";
import { createPeerConnection } from "./webrtc";
import * as Api from "./api";

import noiseGateUrl from '../assets/audio-worklets/noisegate.js?url';

type RoomPeer = {
    connId: string;
    connection: RTCPeerConnection;
    videoContainer: HTMLDivElement;
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

        const localVideoContainer = viewport.appendChild(document.createElement("div"));
        localVideoContainer.classList.add("video-container");

        const localVideoElement = localVideoContainer.appendChild(document.createElement("video"));
        localVideoElement.muted = true;
        localVideoElement.defaultMuted = true;
        localVideoElement.autoplay = true;
        localVideoElement.srcObject = localStream;
        localVideoElement.onloadedmetadata = () => {
            localVideoElement.play();
        };

        websocketService.addMessageHandler(async (message) => {
            if (message.type === Api.WebsocketMessageType.CONNECT) {
                for (const [connId, roomPeer] of Object.entries(peers)) {
                    roomPeer.videoContainer.remove();
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

                const remoteVideoContainer = viewport.appendChild(document.createElement("div"));
                remoteVideoContainer.classList.add("video-container");

                const remoteVideoElement = remoteVideoContainer.appendChild(document.createElement("video"));
                remoteVideoElement.muted = true;
                remoteVideoElement.defaultMuted = true;
                remoteVideoElement.autoplay = true;
                remoteVideoElement.onloadedmetadata = () => {
                    remoteVideoElement.play();
                };

                const remoteAudioElement = remoteVideoContainer.appendChild(document.createElement("audio"));
                remoteAudioElement.autoplay = true;
                remoteAudioElement.onloadedmetadata = () => {
                    remoteAudioElement.play();
                }

                const peerConnection = await createPeerConnection(localConnId > peerJoinData.connId, peerJoinData.connId, websocketService);
                peerConnection.ontrack = async (event) => {
                    remoteVideoElement.srcObject = event.streams[0];
                    const audioContext = new AudioContext();
                    await audioContext.audioWorklet.addModule(noiseGateUrl);

                    const audioSource = audioContext.createMediaStreamSource(event.streams[0]);
                    const audioChain: AudioNode[] = [audioSource];

                    const highPassFilter = audioContext.createBiquadFilter();
                    highPassFilter.type = 'highpass';
                    highPassFilter.frequency.value = 100;
                    audioChain.push(highPassFilter);

                    const lowPassFilter = audioContext.createBiquadFilter();
                    lowPassFilter.type = 'lowpass';
                    lowPassFilter.frequency.value = 9000;
                    audioChain.push(lowPassFilter);

                    const noiseGateNode = new AudioWorkletNode(audioContext, 'noisegate-audio-worklet');
                    /*
                        {name: 'attack', defaultValue: 0.05, minValue: 0, maxValue: 0.1},
                        {name: 'release', defaultValue: 0.05, minValue: 0, maxValue: 0.1},
                        {name: 'threshold', defaultValue: -40, minValue: -100, maxValue: 0},
                        {name: 'timeConstant', defaultValue: 0.0025, minValue: 0, maxValue: 0.1}
                    */
                    noiseGateNode.parameters.get("attack").value = 0.05;
                    noiseGateNode.parameters.get("release").value = 0.05;
                    noiseGateNode.parameters.get("threshold").value = -40;
                    noiseGateNode.parameters.get("timeConstant").value = 0.0025;
                    noiseGateNode.port.onmessage = (ev) => {
                        if (ev.data.speaking) {
                            remoteVideoContainer.classList.add("speaking");
                        } else {
                            remoteVideoContainer.classList.remove("speaking");
                        }
                    }
                    audioChain.push(noiseGateNode);

                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = 2;
                    audioChain.push(gainNode);

                    const mediaStreamDestination = audioContext.createMediaStreamDestination();
                    audioChain.push(mediaStreamDestination);

                    let previousNode: AudioNode | null = null;
                    for (const currentNode of audioChain) {
                        if (previousNode !== null) {
                            previousNode.connect(currentNode);
                        }
                        previousNode = currentNode;
                    }

                    remoteAudioElement.srcObject = mediaStreamDestination.stream;
                };
                for (const track of localStream.getTracks()) {
                    peerConnection.addTrack(track, localStream);
                }
                peers[peerJoinData.connId] = {connId: peerJoinData.connId, connection: peerConnection, videoContainer: remoteVideoContainer};
            } else if (message.type === Api.WebsocketMessageType.PEER_DROP) {
                const peerDropData: Api.PeerDropData = message.data;
                if (peerDropData.connId == localConnId) {
                    return;
                }
                const roomPeer = peers[peerDropData.connId];
                if (!roomPeer) {
                    return;
                }
                roomPeer.videoContainer.remove();
                roomPeer.connection.close();
                roomPeer.connection.dispatchEvent(new CustomEvent("peerclose"));
                delete peers[peerDropData.connId];
            }
        });
        await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
    }));

    console.log("Semaphore App Loaded");
});
