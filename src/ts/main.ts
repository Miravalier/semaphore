import * as Elements from "./elements" ;
import { Future } from "./async";

type ScreenCaptureSource = {
    id: string;
    type: "screen" | "window";
    name: string;
    thumbnail: string;
};

type TurnServerInfo = {
    hostname: string;
    username: string;
    password: string;
};

declare const electronApi: {
    selectScreen: (id: string) => Promise<void>;
    getScreens: () => Promise<ScreenCaptureSource[]>;
    getTurnServerInfo: () => Promise<TurnServerInfo>;
};

window.addEventListener("load", async () => {
    console.log("Semaphore App Loading ...");

    const turnServerInfo = await electronApi.getTurnServerInfo();
    const iceConfiguration = {
        iceServers: [
            {
                urls: `turn:${turnServerInfo.hostname}`,
                username: turnServerInfo.username,
                credential: turnServerInfo.password,
            },
        ],
    };
    console.log(turnServerInfo);
    // const peerConnection = new RTCPeerConnection(iceConfiguration);

    const viewport = document.body.appendChild(Elements.div("viewport"));
    viewport.appendChild(Elements.h1([], "Semaphore")).style.textAlign = 'center';

    viewport.appendChild(Elements.button([], "Start", async () => {
        // Select a screen to share
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

        // Acquire the selected screen as a stream and attach it to a video object
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: {
                width: 640,
                height: 480,
                frameRate: 30
            }
        });

        console.log("Audio Tracks", stream.getAudioTracks());
        console.log("Video Tracks", stream.getVideoTracks());

        const videoElement = viewport.appendChild(document.createElement("video"));
        videoElement.autoplay = true;
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
        };
    }));

    console.log("Semaphore App Loaded");
});
