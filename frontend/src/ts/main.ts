import * as Elements from "./elements";
import * as Sources from "./sources";
import * as Api from "./api";
import { createPeerConnection } from "./webrtc";
import { animals, adjectives } from "./names";
import { intFromStringByHashing, randomChoice } from "./utils";

import noiseGateUrl from '../assets/audio-worklets/noisegate.js?url';

enum StreamType {
    VIDEO = 0,
    SCREENSHARE = 1,
};

type RoomStream = {
    streamId: string;
    intervalId: number;
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
    audioContext: AudioContext,
    tracks: MediaStreamTrack[],
    container: HTMLDivElement,
};

let localConnId: string = null as any;
let localName = `${randomChoice(adjectives)} ${randomChoice(animals)}`;
let localPriority: number = 0;
let localAnalyser: AnalyserNode | null = null;
const roomId = "default";
const websocketService: Api.WebsocketService = new Api.WebsocketService();
const peers: {[connId: string]: RoomPeer} = {};
const outboundStreams: {[id: string]: OutboundStream} = {};

type ConnectionSettings = {
    priority: number;
    gain: number;
}


function saveConnectionSettings(connId: string, settings: ConnectionSettings) {
    localStorage.setItem(`${connId}-settings`, JSON.stringify(settings));
}

async function loadConnectionSettings(connId: string): Promise<ConnectionSettings> {
    const serializedSettings = localStorage.getItem(`${connId}-settings`);
    if (serializedSettings) {
        return JSON.parse(serializedSettings);
    } else {
        return {
            priority: await intFromStringByHashing(connId),
            gain: 4.0,
        }
    }
}


window.addEventListener("load", async () => {
    console.log("Semaphore App Loading ...");

    websocketService.addMessageHandler(async (message) => {
        if (message.type === Api.WebsocketMessageType.CONNECT) {
            const connectData: Api.ServerConnectData = message.data;
            localConnId = connectData.connId;
            localPriority = await intFromStringByHashing(localConnId);
            await websocketService.send({type: Api.WebsocketMessageType.CONNECT, data: {name: localName}});
            console.log(`I am ${localName} ${localConnId}`);
        }
    });
    websocketService.init();

    const viewport = document.body.appendChild(Elements.div("viewport"));

    function updateViewportGrid() {
        let streamCount = Object.values(outboundStreams).length;
        for (const peer of Object.values(peers)) {
            streamCount += Object.values(peer.streams).length;
        }
        viewport.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(streamCount))}, 1fr)`;
    }

    const startButton = viewport.appendChild(Elements.button(["connect"], "Connect", async () => {
        startButton.disabled = true;
        startButton.classList.add("hidden");

        async function addOutboundStream(type: StreamType, stream: MediaStream) {
            const localVideoContainer = viewport.appendChild(document.createElement("div"));
            localVideoContainer.classList.add("video-container");
            localVideoContainer.style.order = localPriority.toString();

            if (stream.getVideoTracks().length == 0) {
                localVideoContainer.appendChild(Elements.div("name-label", localName));
            }

            const localVideoElement = localVideoContainer.appendChild(document.createElement("video"));
            localVideoElement.muted = true;
            localVideoElement.defaultMuted = true;
            localVideoElement.autoplay = true;
            localVideoElement.srcObject = stream;
            localVideoElement.onloadedmetadata = () => {
                localVideoElement.play();
            };

            let audioContext: AudioContext | null = null;
            const tracks: MediaStreamTrack[] = [];

            if (type === StreamType.VIDEO) {
                audioContext = new AudioContext();
                await audioContext.audioWorklet.addModule(noiseGateUrl);

                const audioSource = audioContext.createMediaStreamSource(stream);
                const audioChain: AudioNode[] = [audioSource];

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                audioChain.push(analyser);
                localAnalyser = analyser;

                const highPassFilter = audioContext.createBiquadFilter();
                highPassFilter.type = 'highpass';
                highPassFilter.frequency.value = 100;
                audioChain.push(highPassFilter);

                const lowPassFilter = audioContext.createBiquadFilter();
                lowPassFilter.type = 'lowpass';
                lowPassFilter.frequency.value = 9000;
                audioChain.push(lowPassFilter);

                const noiseGateNode = new AudioWorkletNode(audioContext, 'noisegate-audio-worklet');
                noiseGateNode.parameters.get("attack").value = 0.025;
                noiseGateNode.parameters.get("release").value = 0.05;
                noiseGateNode.parameters.get("threshold").value = Sources.getInputThreshold();
                noiseGateNode.parameters.get("timeConstant").value = 0.0025;
                noiseGateNode.port.onmessage = (ev) => {
                    if (ev.data.speaking) {
                        localVideoContainer.classList.add("speaking");
                    } else {
                        localVideoContainer.classList.remove("speaking");
                    }
                }
                audioChain.push(noiseGateNode);

                const mediaStreamDestination = audioContext.createMediaStreamDestination();
                audioChain.push(mediaStreamDestination);

                let previousNode: AudioNode | null = null;
                for (const currentNode of audioChain) {
                    if (previousNode !== null) {
                        previousNode.connect(currentNode);
                    }
                    previousNode = currentNode;
                }

                for (const track of stream.getVideoTracks()) {
                    tracks.push(track);
                }
                for (const track of mediaStreamDestination.stream.getTracks()) {
                    tracks.push(track);
                }
            } else {
                for (const track of stream.getTracks()) {
                    tracks.push(track);
                }
            }

            outboundStreams[stream.id] = {type, stream, tracks, audioContext, container: localVideoContainer};
            for (const peer of Object.values(peers)) {
                for (const track of tracks) {
                    console.log("Sending Track", stream.id, track.kind, "to", peer.name);
                    peer.connection.addTrack(track, stream);
                }
            }
        }

        function removeOutboundStream(id: string) {
            const oldStream = outboundStreams[id];
            if (oldStream.type === StreamType.VIDEO) {
                localAnalyser = null;
            }
            oldStream.container.remove();
            for (const oldTrack of oldStream.tracks) {
                console.log("Removing Outbound Track", oldTrack.id, "From Stream", oldStream.stream.id);
                for (const peer of Object.values(peers)) {
                    const sender = peer.connection.getSenders().find(s => s.track && s.track.id == oldTrack.id);
                    if (sender) {
                        peer.connection.removeTrack(sender);
                    }
                }
                oldStream.stream.removeTrack(oldTrack);
            }
            if (oldStream.audioContext) {
                oldStream.audioContext.close();
            }
            delete outboundStreams[id];
            console.log("Removing Outbound Stream", oldStream.stream.id);
        }

        function findOutboundStream(type: StreamType): OutboundStream | null {
            for (const outboundStream of Object.values(outboundStreams)) {
                if (outboundStream.type === type) {
                    return outboundStream;
                }
            }
            return null;
        }

        function setOutboundStream(type: StreamType, stream: MediaStream) {
            let streamDelta = 0;
            const oldStream = findOutboundStream(type);
            if (oldStream !== null) {
                removeOutboundStream(oldStream.stream.id);
                streamDelta -= 1;
            }
            if (stream !== null) {
                addOutboundStream(type, stream);
                streamDelta += 1;
            }
            if (streamDelta != 0) {
                updateViewportGrid();
            }
        }

        function deleteInboundStream(connId: string, streamId: string) {
            console.log("Removing Remote Stream", streamId);

            const peer = peers[connId];
            if (!peer) {
                return;
            }

            const stream = peer.streams[streamId];
            if (!stream) {
                return;
            }

            delete peer.streams[streamId];
            if (stream.intervalId !== 0) {
                clearInterval(stream.intervalId);
            }
            stream.container.remove();
            updateViewportGrid();
        }

        function deleteInboundPeer(connId: string) {
            const peer = peers[connId];
            if (!peer) {
                return;
            }

            for (const streamId of Object.keys(peer.streams)) {
                deleteInboundStream(connId, streamId);
            }
            peer.connection.close();
            peer.connection.dispatchEvent(new CustomEvent("peerclose"));
            delete peers[connId];
        }

        await Sources.selectDevices(Sources.SelectDeviceType.InitialSelect, localAnalyser);

        const localControlRegion = document.createElement("div");
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
            setOutboundStream(StreamType.VIDEO, await Sources.getVideoStream());
        } else if (Sources.audioIsSelected()) {
            videoButton.innerHTML = `<i class="fa-solid fa-video-slash"></i>`;
            setOutboundStream(StreamType.VIDEO, await Sources.getMicrophoneStream());
        } else {
            startButton.disabled = false;
            startButton.classList.remove("hidden");
            throw "No Audio Device selected";
        }

        document.body.appendChild(localControlRegion);

        videoButton.addEventListener("click", async () => {
            if (!localVideo) {
                // If no video is selected, prompt the user to select a video input
                if (!Sources.videoIsSelected()) {
                    await Sources.selectDevices(Sources.SelectDeviceType.TurnOnVideo, localAnalyser);
                }
                // User might *still* not have selected a video input
                if (!Sources.videoIsSelected()) {
                    throw "No video selected";
                }
                setOutboundStream(StreamType.VIDEO, await Sources.getVideoStream());
            } else {
                setOutboundStream(StreamType.VIDEO, await Sources.getMicrophoneStream());
            }
            localVideo = !localVideo;
            if (localVideo) {
                videoButton.innerHTML = `<i class="fa-solid fa-video"></i>`;
            } else {
                videoButton.innerHTML = `<i class="fa-solid fa-video-slash"></i>`;
            }
        });

        let localScreenShare = false;
        const screenShareButton = localControlRegion.appendChild(Elements.button(["screen-share"], `<i class="fa-solid fa-display-slash"></i>`));
        screenShareButton.addEventListener("click", async () => {
            if (!localScreenShare) {
                setOutboundStream(StreamType.SCREENSHARE, await Sources.getScreenShare());
            } else {
                setOutboundStream(StreamType.SCREENSHARE, null);
            }
            localScreenShare = !localScreenShare;
            if (localScreenShare) {
                screenShareButton.innerHTML = `<i class="fa-solid fa-display"></i>`;
            } else {
                screenShareButton.innerHTML = `<i class="fa-solid fa-display-slash"></i>`;
            }
        });

        const settingsButton = localControlRegion.appendChild(Elements.button(["settings"], `<i class="fa-solid fa-gear"></i>`));
        settingsButton.addEventListener("click", async () => {
            if (localVideo) {
                await Sources.selectDevices(Sources.SelectDeviceType.SettingsWithVideo, localAnalyser);
                if (Sources.videoIsSelected()) {
                    setOutboundStream(StreamType.VIDEO, await Sources.getVideoStream());
                } else {
                    videoButton.click();
                }
            } else {
                await Sources.selectDevices(Sources.SelectDeviceType.SettingsWithAudio, localAnalyser);
                setOutboundStream(StreamType.VIDEO, await Sources.getMicrophoneStream());
            }
        });

        const endCallButton = localControlRegion.appendChild(Elements.button(["end-call"], `<i class="fa-solid fa-phone-hangup"></i>`));
        endCallButton.addEventListener("click", () => {
            location.reload();
        });

        websocketService.addMessageHandler(async (message) => {
            // Reconnect Handler
            if (message.type === Api.WebsocketMessageType.CONNECT) {
                for (const connId of Object.keys(peers)) {
                    deleteInboundPeer(connId);
                }
                await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
            // Peer Join Handler
            } else if (message.type === Api.WebsocketMessageType.PEER_JOIN) {
                const peerJoinData: Api.PeerJoinData = message.data;
                if (peerJoinData.connId == localConnId) {
                    return;
                }

                console.log("PEER CONNECTED", peerJoinData.name, peerJoinData.connId);
                const connSettings = await loadConnectionSettings(peerJoinData.connId);

                const roomPeer: RoomPeer = {name: peerJoinData.name, connId: peerJoinData.connId, connection: null, streams: {}};
                roomPeer.connection = await createPeerConnection(localConnId > peerJoinData.connId, peerJoinData.connId, websocketService, async (stream, track) => {
                    console.log("Track Received", stream.id, track.kind, "from", roomPeer.name);
                    // Lookup roomStream or create one if this is the first track of the stream
                    let roomStream = roomPeer.streams[stream.id];
                    if (!roomStream) {
                        const remoteStreamContainer = document.createElement("div");
                        remoteStreamContainer.classList.add("video-container");
                        remoteStreamContainer.appendChild(Elements.div("name-label", peerJoinData.name));
                        remoteStreamContainer.style.order = connSettings.priority.toString();

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
                            intervalId: 0,
                        };
                        roomPeer.streams[stream.id] = roomStream;

                        updateViewportGrid();
                        viewport.appendChild(remoteStreamContainer);


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
                                deleteInboundStream(roomPeer.connId, roomStream.streamId);
                            }
                        };

                        remoteVideoElement.srcObject = stream;
                    }

                    // Add this track to the roomStream
                    roomStream.tracks.add(track.id);

                    // If this stream contains a video track, remove the name label from this container
                    if (track.kind === "video") {
                        const nameLabel = roomStream.container.querySelector(".name-label");
                        nameLabel.classList.add("hidden");
                        nameLabel.textContent = `${nameLabel.textContent} (Video Hidden)`;
                        const controlRegion = roomStream.container.querySelector(".control-region");
                        let hidden = false;
                        const hideButton = controlRegion.appendChild(Elements.button("hide", `<i class="fa-solid fa-eye"></i>`, () => {
                            hidden = !hidden;
                            if (hidden) {
                                nameLabel.classList.remove("hidden");
                                roomStream.videoElement.classList.add("hidden");
                                hideButton.innerHTML = `<i class="fa-solid fa-eye-slash"></i>`;
                            } else {
                                nameLabel.classList.add("hidden");
                                roomStream.videoElement.classList.remove("hidden");
                                hideButton.innerHTML = `<i class="fa-solid fa-eye"></i>`;
                            }
                        }));
                    }

                    // If this is an audio track, hook it up to the audio element for this stream
                    if (track.kind === "audio") {
                        const audioContext = new AudioContext();

                        const audioSource = audioContext.createMediaStreamSource(stream);
                        const audioChain: AudioNode[] = [audioSource];

                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 2048;
                        audioChain.push(analyser);

                        const gainNode = audioContext.createGain();
                        if (roomStream.muted) {
                            gainNode.gain.value = 0;
                        } else {
                            gainNode.gain.value = connSettings.gain;
                        }
                        audioChain.push(gainNode);

                        roomStream.volumeInput.value = Math.round((gainNode.gain.value / 8.0) * 100.0).toString();
                        roomStream.volumeInput.addEventListener("input", () => {
                            let targetValue: number;
                            if (roomStream.muted) {
                                targetValue = 0;
                            } else {
                                targetValue = (parseFloat(roomStream.volumeInput.value) / 100.0) * 8.0;
                            }
                            gainNode.gain.setTargetAtTime(targetValue, audioContext.currentTime, 0.015);
                        });
                        roomStream.volumeInput.addEventListener("change", () => {
                            connSettings.gain = (parseFloat(roomStream.volumeInput.value) / 100.0) * 8.0;
                            saveConnectionSettings(roomPeer.connId, connSettings);
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

                        const timeDomainBuffer = new Uint8Array(analyser.frequencyBinCount);
                        if (roomStream.intervalId !== 0) {
                            clearInterval(roomStream.intervalId);
                        }
                        let speaking = false;
                        let misses = 0;
                        roomStream.intervalId = setInterval(() => {
                            analyser.getByteTimeDomainData(timeDomainBuffer);
                            let volume = 0.0;
                            for (let i=0; i < timeDomainBuffer.length; i++) {
                                volume += Math.abs(timeDomainBuffer[i] - 128) / 128;
                            }
                            if (speaking) {
                                if (volume > 1.0) {
                                    misses = 0;
                                } else {
                                    misses += 1;
                                    if (misses >= 3) {
                                        speaking = false;
                                        roomStream.container.classList.remove("speaking");
                                    }
                                }
                            } else {
                                if (volume > 1.0) {
                                    speaking = true;
                                    roomStream.container.classList.add("speaking");
                                }
                            }
                        }, 50);
                    }
                });
                peers[peerJoinData.connId] = roomPeer;
                for (const streamData of Object.values(outboundStreams)) {
                    const outboundStream = streamData.stream;
                    for (const track of streamData.tracks) {
                        console.log("Sending Track", outboundStream.id, track.kind, "to", peerJoinData.name);
                        roomPeer.connection.addTrack(track, outboundStream);
                    }
                }
            // Peer Drop Handler
            } else if (message.type === Api.WebsocketMessageType.PEER_DROP) {
                const peerDropData: Api.PeerDropData = message.data;
                if (peerDropData.connId == localConnId) {
                    return;
                }
                deleteInboundPeer(peerDropData.connId);
            }
        });
        await websocketService.send({type: Api.WebsocketMessageType.ROOM_JOIN, data: {roomId}});
    }));

    console.log("Semaphore App Loaded");
});
