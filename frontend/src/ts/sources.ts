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


export function audioIsSelected(): boolean {
    return selectedAudioDevice !== null;
}


export function videoIsSelected(): boolean {
    return selectedVideoDevice !== null;
}


export enum SelectDeviceType {
    AudioOnly = 0,
    VideoAllowed = 1,
    VideoRequested = 2,
    VideoRequired = 3,
}


export async function selectDevices(requestType: SelectDeviceType): Promise<void> {
    // In the browser, you have to ask for permissions before you can
    // enumerate the microphones or video devices.
    if (!isElectron()) {
        if (requestType === SelectDeviceType.VideoRequested) {
            await getVideoPermissions();
        } else if (requestType === SelectDeviceType.VideoRequired) {
            if (!await getVideoPermissions()) {
                throw "Failed to get video permissions";
            }
        } else {
            await getAudioPermissions();
        }
    }
    const dialogResult = new Future<{audioUuid: string, videoUuid: string}>();
    const devices = await navigator.mediaDevices.enumerateDevices();
    const dialog = Elements.div("dialog");

    const audioSelectContainer = dialog.appendChild(Elements.div("field"));
    const audioSelectLabel = audioSelectContainer.appendChild(Elements.div("label"));
    audioSelectLabel.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
    const audioSelect = audioSelectContainer.appendChild(document.createElement("select"));

    const videoSelectContainer = dialog.appendChild(Elements.div("field"));
    const videoSelectLabel = videoSelectContainer.appendChild(Elements.div("label"));
    videoSelectLabel.innerHTML = `<i class="fa-solid fa-video"></i>`;
    const videoSelect = videoSelectContainer.appendChild(document.createElement("select"));

    const noVideoOption = videoSelect.appendChild(document.createElement("option"));
    noVideoOption.value = "";
    noVideoOption.textContent = "None";
    const deviceMap: {[id: string]: MediaDeviceInfo} = {};
    let audioOptionCount = 0;
    let videoOptionCount = 0;
    for (const device of devices) {
        if (!device.deviceId) {
            continue;
        }
        const uuid = crypto.randomUUID();
        deviceMap[uuid] = device;
        if (device.kind === "audioinput") {
            const audioOption = audioSelect.appendChild(document.createElement("option"));
            audioOption.value = uuid;
            audioOption.textContent = device.label;
            audioOptionCount += 1;
            if (selectedAudioDevice !== null && selectedAudioDevice.deviceId === device.deviceId) {
                audioSelect.value = uuid;
            }
        } else if (device.kind === "videoinput") {
            const videoOption = videoSelect.appendChild(document.createElement("option"));
            videoOption.value = uuid;
            videoOption.textContent = device.label;
            videoOptionCount += 1;
            if (selectedVideoDevice !== null && selectedVideoDevice.deviceId === device.deviceId) {
                videoSelect.value = uuid;
            }
        }
    }
    if (audioOptionCount == 0) {
        const audioOption = audioSelect.appendChild(document.createElement("option"));
        audioOption.value = "";
        audioOption.textContent = "(No Audio Sources)";
    }
    if (videoOptionCount == 0 || requestType === SelectDeviceType.AudioOnly) {
        videoSelect.value = "";
        videoSelectContainer.remove();
    }
    dialog.appendChild(Elements.button([], "Save", () => {
        dialogResult.resolve({audioUuid: audioSelect.value, videoUuid: videoSelect.value});
    }));
    document.body.appendChild(dialog);
    const {audioUuid, videoUuid} = await dialogResult;
    dialog.remove();

    if (audioUuid === "") {
        selectedAudioDevice = null;
    } else {
        selectedAudioDevice = deviceMap[audioUuid];
    }
    if (videoUuid === "") {
        selectedVideoDevice = null;
    } else {
        selectedVideoDevice = deviceMap[videoUuid];
    }
}


export async function getMicrophoneStream(): Promise<MediaStream> {
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
            },
        });
    }
}


export async function getAudioPermissions(): Promise<boolean> {
    if (isElectron()) {
        return true;
    }
    try {
        await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        return true;
    } catch {
        return false;
    }
}


export async function getVideoPermissions(): Promise<boolean> {
    if (isElectron()) {
        return true;
    }
    try {
        await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        return true;
    } catch {
        return false;
    }
}


export async function getVideoStream(): Promise<MediaStream> {
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
                noiseSuppression: false,
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
                noiseSuppression: false,
            },
            video: true,
        });
    }
}
