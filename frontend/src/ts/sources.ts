import * as Elements from "./elements";
import { Future } from "./async";


let selectedAudioDevice: MediaDeviceInfo | null = null;
let selectedVideoDevice: MediaDeviceInfo | null = null;


export type ScreenCaptureSource = {
    id: string;
    type: "screen" | "window";
    name: string;
    thumbnail: string;
};


declare const electronApi: {
    selectScreen: (id: string) => Promise<void>;
    getScreens: () => Promise<ScreenCaptureSource[]>;
};


export function isElectron(): boolean {
    return navigator.userAgent.indexOf('Electron') !== -1;
}

export function videoIsSelected(): boolean {
    return selectedVideoDevice !== null;
}


export async function selectDevices(): Promise<void> {
    if (!isElectron()) return;

    const dialogResult = new Future<{audioId: string, videoId: string}>();
    const devices = await navigator.mediaDevices.enumerateDevices();
    const dialog = document.body.appendChild(Elements.div("dialog"));
    const audioSelect = dialog.appendChild(document.createElement("select"));
    const videoSelect = dialog.appendChild(document.createElement("select"));
    const noVideoOption = videoSelect.appendChild(document.createElement("option"));
    noVideoOption.value = "";
    noVideoOption.textContent = "None";
    const deviceMap: {[id: string]: MediaDeviceInfo} = {};
    for (const device of devices) {
        const uuid = crypto.randomUUID();
        deviceMap[uuid] = device;
        if (device.kind === "audioinput") {
            const audioOption = audioSelect.appendChild(document.createElement("option"));
            audioOption.value = uuid;
            audioOption.textContent = device.label;
        } else if (device.kind === "videoinput") {
            const videoOption = videoSelect.appendChild(document.createElement("option"));
            videoOption.value = uuid;
            videoOption.textContent = device.label;
        }
    }
    dialog.appendChild(Elements.button([], "Join Call", () => {
        dialogResult.resolve({audioId: audioSelect.value, videoId: videoSelect.value});
    }));
    const {audioId, videoId} = await dialogResult;
    dialog.remove();

    selectedAudioDevice = deviceMap[audioId];
    if (videoId === "") {
        selectedVideoDevice = null;
    } else {
        selectedVideoDevice = deviceMap[videoId];
    }
}


export async function getMicrophoneStream(): Promise<MediaStream> {
    if (isElectron()) {
        if (selectedAudioDevice !== null) {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: {exact: selectedAudioDevice.deviceId},
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: {exact: false},
                }
            });
        } else {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: {exact: false},
                }
            });
        }
    } else {
        return await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: {exact: false},
            },
        });
    }
}


export async function getVideoStream(): Promise<MediaStream> {
    if (isElectron()) {
        if (selectedVideoDevice === null) {
            return await getMicrophoneStream();
        } else {
            if (selectedAudioDevice !== null) {
                return await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: {exact: selectedVideoDevice.deviceId},
                    },
                    audio: {
                        deviceId: {exact: selectedAudioDevice.deviceId},
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: {exact: false},
                    },
                });
            } else {
                return await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: {exact: selectedVideoDevice.deviceId},
                    },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: {exact: false},
                    },
                });
            }
        }
    } else {
        try {
            return await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: {exact: false},
                },
            });
        } catch {
            return await getMicrophoneStream();
        }
    }
}


export async function getScreenShare(): Promise<MediaStream> {
    if (isElectron()) {
        const screens = await electronApi.getScreens();
        const screenIdFuture = new Future<string>();
        const dialog = document.body.appendChild(Elements.div("dialog"));
        for (const screen of screens) {
            const screenOption = dialog.appendChild(Elements.div("screen"));
            screenOption.addEventListener("click", () => {
                screenIdFuture.resolve(screen.id);
            });
            screenOption.appendChild(Elements.img("thumbnail", screen.thumbnail));
            screenOption.appendChild(Elements.div("name", screen.name));
        }
        const screenId = await screenIdFuture;
        dialog.remove();

        await electronApi.selectScreen(screenId);
        return await navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: false,
                autoGainControl: false,
            },
            video: {
                width: 1920,
                height: 1080,
                frameRate: 15
            },
        });
    } else {
        return await navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: false,
                autoGainControl: {exact: false},
            },
            video: true,
        });
    }
}
