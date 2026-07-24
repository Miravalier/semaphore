import * as Elements from "./elements";
import { Future } from "./async";

let haveVideoPermissions = false;
let haveAudioPermissions = false;
let selectedAudioDevice: MediaDeviceInfo | null = null;
let selectedVideoDevice: MediaDeviceInfo | null = null;
let inputThreshold: number = -50.0;


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
    SettingsWithAudio = 0,
    SettingsWithVideo = 1,
    InitialSelect = 2,
    TurnOnVideo = 3,
}


export function getInputThreshold(): number {
    return inputThreshold;
}


export async function selectDevices(requestType: SelectDeviceType, analyser: AnalyserNode | null): Promise<void> {
    // In the browser, you have to ask for permissions before you can
    // enumerate the microphones or video devices.
    if (!isElectron()) {
        if (requestType === SelectDeviceType.TurnOnVideo) {
            if (!await getVideoPermissions()) {
                throw "Failed to get video permissions";
            }
        } else {
            await getAudioPermissions();
        }
    }
    const dialogResult = new Future<{apply: boolean, audioUuid: string, videoUuid: string}>();
    const devices = await navigator.mediaDevices.enumerateDevices();
    const dialog = Elements.div("dialog");
    let intervalId = -1;

    // if (analyser !== null) {
    //     const sensitivityContainer = dialog.appendChild(Elements.div(["field", "column"]));
    //     const sensitivityLabel = sensitivityContainer.appendChild(Elements.div("label"));
    //     sensitivityLabel.innerHTML = `Input Sensitivity <i class="fa-solid fa-microphone-signal-meter"></i>`;
    //     const volumeIndicator = sensitivityContainer.appendChild(Elements.div("volume-indicator"));
    //     volumeIndicator.style.width = "120px";
    //     const sensitivityInput = sensitivityContainer.appendChild(document.createElement("input"));
    //     sensitivityInput.type = "range";
    //     sensitivityInput.min = "0";
    //     sensitivityInput.max = "100";
    //     sensitivityInput.step = "any";
    //     sensitivityInput.value = "50";

    //     const minDecibels = analyser.minDecibels;
    //     const maxDecibels = analyser.maxDecibels;
    //     const frequencyBinCount = analyser.frequencyBinCount;
    //     const dataArray = new Uint8Array(frequencyBinCount);
    //     intervalId = setInterval(() => {
    //         analyser.getByteFrequencyData(dataArray);
    //         let sumOfSquares = 0.0;
    //         for (let i=0; i < frequencyBinCount; i++) {
    //             sumOfSquares += dataArray[i] * dataArray[i];
    //         }
    //         let geometricMean = Math.sqrt(sumOfSquares / frequencyBinCount);
    //         if (geometricMean < 0) {
    //             geometricMean = 0;
    //         }
    //         if (geometricMean > 255) {
    //             geometricMean = 255;
    //         }
    //         const volumeDb = (geometricMean / 255) * (maxDecibels - minDecibels) + minDecibels;
    //         console.log("VolumeDb", volumeDb);
    //     }, 50);
    // }

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
    if (videoOptionCount == 0 || requestType === SelectDeviceType.SettingsWithAudio) {
        videoSelect.value = "";
        videoSelectContainer.remove();
    }

    const buttonRow = dialog.appendChild(Elements.div("row"));

    buttonRow.appendChild(Elements.button([], "Save", () => {
        dialogResult.resolve({apply: true, audioUuid: audioSelect.value, videoUuid: videoSelect.value});
    }));

    if (requestType !== SelectDeviceType.InitialSelect) {
        buttonRow.appendChild(Elements.button([], "Cancel", () => {
            dialogResult.resolve({apply: false, audioUuid: null, videoUuid: null});
        }));
    }

    document.body.appendChild(dialog);
    const {apply, audioUuid, videoUuid} = await dialogResult;

    dialog.remove();
    if (intervalId !== -1) {
        clearInterval(intervalId);
    }
    if (!apply) {
        return;
    }

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
    if (haveAudioPermissions) {
        return true;
    }
    try {
        await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        haveAudioPermissions = true;
        return true;
    } catch {
        return false;
    }
}


export async function getVideoPermissions(): Promise<boolean> {
    if (isElectron()) {
        return true;
    }
    if (haveVideoPermissions) {
        return true;
    }
    try {
        await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        haveVideoPermissions = true;
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
