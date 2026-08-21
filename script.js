// ========================================
// ELEMENT
// ========================================

const video =
    document.getElementById("video");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");


// ========================================
// CAMERA
// ========================================

let stream = null;

let running = false;


// ========================================
// GESTURE
// ========================================

let lastGesture = "NORMAL";


// ========================================
// AUDIO
// ========================================

// Sound saat gesture V

const blurSound =
    new Audio("sounds/blur.mp3");

blurSound.volume = 1.0;


// Sound saat kamera mulai

const suaraAwal =
    new Audio("sounds/blurlengkap.mp3");

suaraAwal.volume = 1.0;


// ========================================
// KONTROL SOUND
// ========================================

// Apakah blur.mp3 boleh dimainkan

let bolehBunyi = true;


// Apakah blur.mp3 sedang berjalan

let sedangBunyi = false;


// Apakah efek blur sedang aktif

let blurAktif = false;


// ========================================
// AUDIO CONTEXT
// ========================================

let audioContext = null;


function setupAudio() {

    if (audioContext) {

        return;

    }


    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

}


// ========================================
// SOUND BLUR
// ========================================

async function playBlurSound() {

    // Kalau masih cooldown
    // jangan bunyi

    if (!bolehBunyi) {

        return;

    }


    // Kalau sound masih berjalan
    // jangan mulai lagi

    if (!blurSound.paused) {

        return;

    }


    setupAudio();


    // Aktifkan audio

    if (
        audioContext.state ===
        "suspended"
    ) {

        await audioContext.resume();

    }


    // Kunci sound

    bolehBunyi = false;

    sedangBunyi = true;

    blurAktif = true;


    // Aktifkan blur

    video.classList.add(
        "blur"
    );


    // Mulai sound dari awal

    blurSound.currentTime = 0;


    try {

        await blurSound.play();

    }

    catch (error) {

        console.log(
            "Sound gagal dimainkan:",
            error
        );


        bolehBunyi = true;

        sedangBunyi = false;

        blurAktif = false;


        video.classList.remove(
            "blur"
        );


        return;

    }


    // ====================================
    // SOUND SELESAI
    // ====================================

    blurSound.onended =
        function() {

            sedangBunyi = false;


            // Tunggu 1 detik

            setTimeout(
                function() {

                    // Matikan blur

                    blurAktif = false;

                    video.classList.remove(
                        "blur"
                    );


                    // Sound boleh dimainkan lagi

                    bolehBunyi = true;

                },
                1000
            );

        };

}


// ========================================
// CEK JARI
// ========================================

function fingerUp(
    hand,
    tip,
    pip
) {

    return (
        hand[tip].y <
        hand[pip].y
    );

}


// ========================================
// DETEKSI GESTURE
// ========================================

function detectGesture(hand) {

    // Telunjuk

    const index =
        fingerUp(
            hand,
            8,
            6
        );


    // Jari tengah

    const middle =
        fingerUp(
            hand,
            12,
            10
        );


    // Jari manis

    const ring =
        fingerUp(
            hand,
            16,
            14
        );


    // Kelingking

    const pinky =
        fingerUp(
            hand,
            20,
            18
        );


    // ====================================
    // ✌️ V SIGN
    // ====================================

    if (
        index &&
        middle &&
        !ring &&
        !pinky
    ) {

        return "V";

    }


    // ====================================
    // NORMAL
    // ====================================

    return "NORMAL";

}


// ========================================
// MEDIAPIPE HANDS
// ========================================

const hands =
    new Hands({

        locateFile: function(file) {

            return (
                "https://cdn.jsdelivr.net/npm/" +
                "@mediapipe/hands/" +
                file
            );

        }

    });


hands.setOptions({

    maxNumHands: 1,

    modelComplexity: 0,

    minDetectionConfidence: 0.6,

    minTrackingConfidence: 0.6

});


// ========================================
// HASIL DETEKSI TANGAN
// ========================================

hands.onResults(
    function(results) {

        // Kamera belum siap

        if (!video.videoWidth) {

            return;

        }


        // Ukuran canvas

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        // Bersihkan canvas

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // =================================
        // TIDAK ADA TANGAN
        // =================================

        if (
            !results.multiHandLandmarks ||
            results.multiHandLandmarks.length === 0
        ) {

            lastGesture =
                "NORMAL";


            /*
                JANGAN hapus blur di sini.

                Blur dikontrol oleh
                durasi blur.mp3.
            */

            return;

        }


        // =================================
        // AMBIL TANGAN
        // =================================

        const hand =
            results.multiHandLandmarks[0];


        // =================================
        // DETEKSI
        // =================================

        const gesture =
            detectGesture(hand);


        // =================================
        // ✌️ V
        // =================================

        if (
            gesture === "V"
        ) {

            /*
                Fungsi ini otomatis
                mencegah sound spam.
            */

            playBlurSound();

        }


        /*
            Kalau bukan V, kita TIDAK
            langsung menghapus blur.

            Blur akan hilang setelah:

            blur.mp3 selesai
                    +
                delay 1 detik
        */


        lastGesture =
            gesture;

    }
);


// ========================================
// MULAI KAMERA
// ========================================

async function startCamera() {

    try {

        // =================================
        // AKTIFKAN AUDIO
        // =================================

        setupAudio();


        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();

        }


        // =================================
        // MINTA KAMERA
        // =================================

        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user",

                        width: {

                            ideal: 1280

                        },

                        height: {

                            ideal: 720

                        }

                    },

                    audio: false

                });


        // Masukkan kamera

        video.srcObject =
            stream;


        await video.play();


        // =================================
        // SOUND KAMERA
        // =================================

        suaraAwal.currentTime = 0;


        suaraAwal.play()
            .catch(
                function(error) {

                    console.log(
                        "Sound awal gagal:",
                        error
                    );

                }
            );


        // =================================
        // MULAI PROSES
        // =================================

        running = true;


        lastGesture =
            "NORMAL";


        processCamera();

    }


    catch (error) {

        console.error(
            error
        );


        alert(
            "Kamera tidak bisa dibuka. " +
            "Pastikan izin kamera sudah diberikan."
        );

    }

}


// ========================================
// PROSES KAMERA
// ========================================

async function processCamera() {

    // Kalau kamera berhenti

    if (!running) {

        return;

    }


    try {

        await hands.send({

            image: video

        });

    }


    catch (error) {

        console.error(
            error
        );

    }


    requestAnimationFrame(
        processCamera
    );

}


// ========================================
// STOP KAMERA
// ========================================

function stopCamera() {

    // =================================
    // STOP PROSES
    // =================================

    running = false;


    // =================================
    // STOP KAMERA
    // =================================

    if (stream) {

        stream
            .getTracks()
            .forEach(
                function(track) {

                    track.stop();

                }
            );


        stream = null;

    }


    video.srcObject =
        null;


    // =================================
    // HAPUS BLUR
    // =================================

    video.classList.remove(
        "blur"
    );


    // =================================
    // STOP BLUR SOUND
    // =================================

    blurSound.pause();

    blurSound.currentTime = 0;


    // =================================
    // STOP SOUND AWAL
    // =================================

    suaraAwal.pause();

    suaraAwal.currentTime = 0;


    // =================================
    // RESET SOUND
    // =================================

    bolehBunyi = true;

    sedangBunyi = false;

    blurAktif = false;


    // =================================
    // RESET GESTURE
    // =================================

    lastGesture =
        "NORMAL";

}


// ========================================
// TOMBOL
// ========================================

startBtn.addEventListener(
    "click",
    startCamera
);


stopBtn.addEventListener(
    "click",
    stopCamera
)
