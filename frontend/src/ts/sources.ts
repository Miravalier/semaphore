import * as Elements from "./elements";
import { Future } from "./async";

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


export async function getMicrophoneStream(): Promise<MediaStream> {
    return await navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
        },
    });
}


export async function getVideoStream(): Promise<MediaStream> {
    try {
        return await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,
            },
        });
    } catch {
        return await getMicrophoneStream();
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
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
            video: {
                width: 1280,
                height: 960,
                frameRate: 30
            }
        });
    } else {
        return await navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
            },
            video: true,
        });
    }
}
