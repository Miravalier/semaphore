import * as Elements from "./elements";
import * as Sources from "./sources";
import * as Api from "./api";
import { createPeerConnection } from "./webrtc";
import { animals, adjectives } from "./names";
import { randomChoice } from "./utils";

import noiseGateUrl from '../assets/audio-worklets/noisegate.js?url';

enum StreamType {
    VIDEO = 0,
    SCREENSHARE = 1,
};

type RoomStream = {
    streamId: string;
    container: HTMLDivElement;
    volumeInput: HTMLInputElement;
    videoElement: HTMLVideoElement;
    audioElement: HTMLAudioElement;
    tracks: Set<string>;
    muted: boolean;
};

type RoomPeer = {
    name: string;
    connId: string;
    connection: RTCPeerConnection;
    streams: {[id: string]: RoomStream};
};

type OutboundStream = {
    type: StreamType,
    stream: MediaStream,
    container: HTMLDivElement,
};

let localConnId: string = null as any;
let localName = `${randomChoice(adjectives)} ${randomChoice(animals)}`;
const roomId = "default";
const websocketService: Api.WebsocketService = new Api.WebsocketService();
const peers: {[connId: string]: RoomPeer} = {};
const outboundStreams: {[id: string]: OutboundStream} = {};


window.addEventListener("load", async () => {
    console.log("Semaphore App Loading ...");

    websocketService.addMessageHandler(async (message) => {
        if (message.type === Api.WebsocketMessageType.CONNECT) {
            const connectData: Api.ServerConnectData = message.data;
            localConnId = connectData.connId;
            await websocketService.send({type: Api.WebsocketMessageType.CONNECT, data: {name: localName}});
        }
    });
    websocketService.init();

    const viewport = document.body.appendChild(Elements.div("viewport"));
    const startButton = viewport.appendChild(Elements.button(["connect"], "Connect", async () => {
        startButton.disabled = true;
        startButton.classList.add("hidden");

        function addStream(type: StreamType, stream: MediaStream) {
            const localVideoContainer = viewport.appendChild(document.createElement("div"));
            localVideoContainer.classList.add("video-container");
            localVideoContainer.appendChild(Elements.div("name-label", localName));

            const localVideoElement = localVideoContainer.appendChild(document.createElement("video"));
            localVideoElement.muted = true;
            localVideoElement.defaultMuted = true;
            localVideoElement.autoplay = true;
            localVideoElement.srcObject = stream;
            localVideoElement.onloadedmetadata = () => {
                localVideoElement.play();
            };

            outboundStreams[stream.id] = {type: type, stream: stream, container: localVideoContainer};
            for (const peer of Object.values(peers)) {
                for (const track of stream.getTracks()) {
                    peer.connection.addTrack(track, stream);
                }
            }
        }

        function removeStream(id: string) {
            const oldStream = outboundStreams[id];
            oldStream.container.remove();
            for (const oldTrack of oldStream.stream.getTracks()) {
                console.log("Removing Outbound Track", oldTrack.id, "From Stream", oldStream.stream.id);
                for (const peer of Object.values(peers)) {
                    const sender = peer.connection.getSenders().find(s => s.track && s.track.id == oldTrack.id);
                    if (sender) {
                        peer.connection.removeTrack(sender);
                    }
                }
                oldStream.stream.removeTrack(oldTrack);
            }
            delete outboundStreams[id];
            console.log("Removing Outbound Stream", oldStream.stream.id);
        }

        function findStream(type: StreamType): OutboundStream | null {
            for (const outboundStream of Object.values(outboundStreams)) {
                if (outboundStream.type === type) {
                    return outboundStream;
                }
            }
            return null;
        }

        function replaceStream(type: StreamType, stream: MediaStream) {
            const oldStream = findStream(type);
            if (oldStream !== null) {
                removeStream(oldStream.stream.id);
            }
            if (stream !== null) {
                addStream(type, stream);
            }
        }

        await Sources.selectDevices();

        const localControlRegion = document.body.appendChild(document.createElement("div"));
        localControlRegion.classList.add("control-region");

        let localMute = false;
        const localMuteButton = localControlRegion.appendChild(Elements.button([], `<i class="fa-solid fa-microphone"></i>`));
        localMuteButton.addEventListener("click", () => {
            localMute = !localMute;
            if (localMute) {
                for (const outboundStream of Object.values(outboundStreams)) {
                    for (const track of outboundStream.stream.getAudioTracks()) {
                        track.enabled = false;
                    }
                }
                localMuteButton.classList.add("muted");
                localMuteButton.innerHTML = `<i class="fa-solid fa-microphone-slash"></i>`;
            } else {
                for (const outboundStream of Object.values(outboundStreams)) {
                    for (const track of outboundStream.stream.getAudioTracks()) {
                        track.enabled = true;
                    }
                }
                localMuteButton.classList.remove("muted");
                localMuteButton.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
            }
        });

        let localVideo = Sources.videoIsSelected();
        const videoButton = localControlRegion.appendChild(Elements.button(["video"]));
        if (localVideo) {
            videoButton.innerHTML = `<i class="fa-solid fa-video"></i>`;
            replaceStream(StreamType.VIDEO, await Sources.getVideoStream());
        } else {
            videoButton.innerHTML = `<i class="fa-solid fa-video-slash"></i>`;
            replaceStream(StreamType.VIDEO, await Sources.getMicrophoneStream());
        }

        videoButton.addEventListener("click", async () => {
            localVideo = !localVideo;
            if (localVideo) {
                if (!Sources.videoIsSelected()) {
                    await Sources.selectDevices();
                }
                videoButton.innerHTML = `<i class="fa-solid fa-video"></i>`;
                replaceStream(StreamType.VIDEO, await Sources.getVideoStream());
            } else {
                videoButton.innerHTML = `<i class="fa-solid fa-video-slash"></i>`;
                replaceStream(StreamType.VIDEO, await Sources.getMicrophoneStream());
            }
        });

        let localScreenShare = false;
        const screenShareButton = localControlRegion.appendChild(Elements.button(["screen-share"], `<i class="fa-solid fa-display-slash"></i>`));
        screenShareButton.addEventListener("click", async () => {
            localScreenShare = !localScreenShare;
            if (localScreenShare) {
                screenShareButton.innerHTML = `<i class="fa-solid fa-display"></i>`;
                replaceStream(StreamType.SCREENSHARE, await Sources.getScreenShare());
            } else {
                screenShareButton.innerHTML = `<i class="fa-solid fa-display-slash"></i>`;
                replaceStream(StreamType.SCREENSHARE, null);
            }
        });

        const settingsButton = localControlRegion.appendChild(Elements.button(["settings"], `<i class="fa-solid fa-gear"></i>`));
        settingsButton.addEventListener("click", () => {

        });

        const endCallButton = localControlRegion.appendChild(Elements.button(["end-call"], `<i class="fa-solid fa-phone-hangup"></i>`));
        endCallButton.addEventListener("click", () => {
            location.reload();
        });

        websocketService.addMessageHandler(async (message) => {
            // Reconnect Handler
            if (message.type === Api.WebsocketMessageType.CONNECT) {
                for (const [connId, roomPeer] of Object.entries(peers)) {
                    for (const roomStream of Object.values(roomPeer.streams)) {
                        roomStream.container.remove();
                    }
                    roomPeer.connection.close();
                    roomPeer.connection.dispatchEvent(new CustomEvent("peerclose"));
                    delete peers[connId];
                    await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
                }
            // Peer Join Handler
            } else if (message.type === Api.WebsocketMessageType.PEER_JOIN) {
                const peerJoinData: Api.PeerJoinData = message.data;
                if (peerJoinData.connId == localConnId) {
                    return;
                }

                const roomPeer: RoomPeer = {name: peerJoinData.name, connId: peerJoinData.connId, connection: null, streams: {}};
                roomPeer.connection = await createPeerConnection(localConnId > peerJoinData.connId, peerJoinData.connId, websocketService, async (stream, track) => {
                    // Lookup roomStream or create one if this is the first track of the stream
                    let roomStream = roomPeer.streams[stream.id];
                    if (!roomStream) {
                        const remoteStreamContainer = viewport.appendChild(document.createElement("div"));
                        remoteStreamContainer.classList.add("video-container");
                        remoteStreamContainer.appendChild(Elements.div("name-label", peerJoinData.name));

                        const remoteControlRegion = remoteStreamContainer.appendChild(document.createElement("div"));
                        remoteControlRegion.classList.add("control-region");

                        const volumeRegion = remoteControlRegion.appendChild(Elements.div(["volume-region"]));
                        const muteButton = volumeRegion.appendChild(Elements.button([], `<i class="fa-solid fa-volume"></i>`));
                        const volumeInput = volumeRegion.appendChild(document.createElement("input"));
                        volumeInput.type = "range";
                        volumeInput.min = "0";
                        volumeInput.max = "100";
                        volumeInput.step = "any";
                        volumeInput.value = "50";

                        const remoteVideoElement = remoteStreamContainer.appendChild(document.createElement("video"));
                        remoteVideoElement.muted = true;
                        remoteVideoElement.defaultMuted = true;
                        remoteVideoElement.autoplay = true;
                        remoteVideoElement.onloadedmetadata = () => {
                            remoteVideoElement.play();
                        };

                        const remoteAudioElement = remoteStreamContainer.appendChild(document.createElement("audio"));
                        remoteAudioElement.autoplay = true;
                        remoteAudioElement.onloadedmetadata = () => {
                            remoteAudioElement.play();
                        }

                        roomStream = {
                            streamId: stream.id,
                            container: remoteStreamContainer,
                            audioElement: remoteAudioElement,
                            videoElement: remoteVideoElement,
                            volumeInput: volumeInput,
                            tracks: new Set(),
                            muted: false,
                        };
                        roomPeer.streams[stream.id] = roomStream;

                        muteButton.addEventListener("click", () => {
                            roomStream.muted = !roomStream.muted;
                            if (roomStream.muted) {
                                muteButton.classList.add("muted");
                                muteButton.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
                            } else {
                                muteButton.classList.remove("muted");
                                muteButton.innerHTML = `<i class="fa-solid fa-volume"></i>`;
                            }
                            volumeInput.dispatchEvent(new InputEvent("input", {}));
                        });

                        stream.onremovetrack = (ev) => {
                            console.log("Removing Remote Track", ev.track.id, "from stream", roomStream.streamId);
                            roomStream.tracks.delete(ev.track.id);
                            if (roomStream.tracks.size == 0) {
                                console.log("Removing Remote Stream", roomStream.streamId);
                                delete roomPeer.streams[roomStream.streamId];
                                roomStream.container.remove();
                            }
                        };

                        remoteVideoElement.srcObject = stream;
                    }

                    // Add this track to the roomStream
                    roomStream.tracks.add(track.id);

                    // If this stream contains a video track, remove the name label from this container
                    if (track.kind === "video") {
                        roomStream.container.querySelector(".name-label")?.remove();
                    }

                    // If this is an audio track, hook it up to the audio element for this stream
                    if (track.kind === "audio") {
                        const audioContext = new AudioContext();
                        await audioContext.audioWorklet.addModule(noiseGateUrl);

                        const audioSource = audioContext.createMediaStreamSource(stream);
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
                                roomStream.container.classList.add("speaking");
                            } else {
                                roomStream.container.classList.remove("speaking");
                            }
                        }
                        audioChain.push(noiseGateNode);

                        const gainNode = audioContext.createGain();
                        if (roomStream.muted) {
                            gainNode.gain.value = 0;
                        } else {
                            gainNode.gain.value = 5.0;
                        }
                        audioChain.push(gainNode);

                        roomStream.volumeInput.addEventListener("input", () => {
                            let targetValue: number;
                            if (roomStream.muted) {
                                targetValue = 0;
                            } else {
                                targetValue = (parseFloat(roomStream.volumeInput.value) / 100.0) * 10.0;
                            }
                            gainNode.gain.setTargetAtTime(targetValue, audioContext.currentTime, 0.015);
                        });

                        const mediaStreamDestination = audioContext.createMediaStreamDestination();
                        audioChain.push(mediaStreamDestination);

                        let previousNode: AudioNode | null = null;
                        for (const currentNode of audioChain) {
                            if (previousNode !== null) {
                                previousNode.connect(currentNode);
                            }
                            previousNode = currentNode;
                        }

                        roomStream.audioElement.srcObject = mediaStreamDestination.stream;
                    }
                });
                peers[peerJoinData.connId] = roomPeer;
                for (const streamData of Object.values(outboundStreams)) {
                    const outboundStream = streamData.stream;
                    for (const track of outboundStream.getTracks()) {
                        roomPeer.connection.addTrack(track, outboundStream);
                    }
                }
            // Peer Drop Handler
            } else if (message.type === Api.WebsocketMessageType.PEER_DROP) {
                const peerDropData: Api.PeerDropData = message.data;
                if (peerDropData.connId == localConnId) {
                    return;
                }
                const roomPeer = peers[peerDropData.connId];
                if (!roomPeer) {
                    return;
                }
                for (const roomStream of Object.values(roomPeer.streams)) {
                    roomStream.container.remove();
                }
                roomPeer.connection.close();
                roomPeer.connection.dispatchEvent(new CustomEvent("peerclose"));
                delete peers[peerDropData.connId];
            }
        });
        await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
    }));

    console.log("Semaphore App Loaded");
});
