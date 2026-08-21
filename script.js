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

const status =
    document.getElementById("status");


// ========================================
// CAMERA
// ========================================

let stream = null;

let running = false;


// ========================================
// AUDIO
// ========================================

const blurSound =
    new Audio("sounds/blur.mp3");

const suaraAwal =
    new Audio("sounds/blurlengkap.mp3");

blurSound.volume = 1;

suaraAwal.volume = 1;


// ========================================
// STATUS SOUND
// ========================================

let bolehBunyi = true;

let blurSedangJalan = false;

let timerBlur = null;


// ========================================
// GESTURE
// ========================================

let gestureTerakhir = "NORMAL";


// ========================================
// CEK JARI
// ========================================

function jariNaik(
    tangan,
    ujung,
    pangkal
) {

    return (
        tangan[ujung].y <
        tangan[pangkal].y
    );

}


// ========================================
// DETEKSI GESTURE
// ========================================

function cekGesture(tangan) {

    const telunjuk =
        jariNaik(
            tangan,
            8,
            6
        );

    const tengah =
        jariNaik(
            tangan,
            12,
            10
        );

    const manis =
        jariNaik(
            tangan,
            16,
            14
        );

    const kelingking =
        jariNaik(
            tangan,
            20,
            18
        );


    // ==============================
    // V SIGN
    // ==============================

    if (
        telunjuk &&
        tengah &&
        !manis &&
        !kelingking
    ) {

        return "V";

    }


    return "NORMAL";

}


// ========================================
// BLUR + SOUND
// ========================================

function mulaiBlur() {

    // Kalau sound masih jalan
    // jangan mulai lagi

    if (blurSedangJalan) {

        return;

    }


    // Kalau masih cooldown

    if (!bolehBunyi) {

        return;

    }


    // ====================================
    // AKTIFKAN BLUR
    // ====================================

    video.classList.add(
        "blur"
    );


    blurSedangJalan = true;

    bolehBunyi = false;


    // Hapus timer lama

    if (timerBlur) {

        clearTimeout(timerBlur);

    }


    // ====================================
    // MAIN SOUND
    // ====================================

    blurSound.currentTime = 0;

    blurSound.play()
        .catch(function(error) {

            console.log(
                "Sound gagal:",
                error
            );

        });


    // ====================================
    // TUNGGU SOUND SELESAI
    // ====================================

    blurSound.onended =
        function() {

            blurSedangJalan = false;


            // Tunggu 1 detik

            timerBlur =
                setTimeout(
                    function() {

                        // Matikan blur

                        video.classList.remove(
                            "blur"
                        );


                        // Boleh bunyi lagi

                        bolehBunyi = true;

                    },
                    1000
                );

        };

}


// ========================================
// MEDIAPIPE
// ========================================

const hands =
    new Hands({

        locateFile:
            function(file) {

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
// HASIL DETEKSI
// ========================================

hands.onResults(
    function(results) {

        if (!video.videoWidth) {

            return;

        }


        // =================================
        // UKURAN CANVAS
        // =================================

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


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

            gestureTerakhir =
                "NORMAL";

            return;

        }


        // =================================
        // AMBIL TANGAN
        // =================================

        const tangan =
            results.multiHandLandmarks[0];


        // =================================
        // CEK GESTURE
        // =================================

        const gesture =
            cekGesture(tangan);


        // =================================
        // V SIGN
        // =================================

        if (
            gesture === "V"
        ) {

            mulaiBlur();

        }


        gestureTerakhir =
            gesture;

    }
);


// ========================================
// MULAI KAMERA
// ========================================

async function mulaiKamera() {

    try {

        // =================================
        // MINTA AKSES KAMERA
        // =================================

        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode: "user",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });


        // =================================
        // TAMPILKAN KAMERA
        // =================================

        video.srcObject =
            stream;


        await video.play();


        // =================================
        // UPDATE STATUS
        // =================================

        status.textContent =
            "Kamera aktif";


        // =================================
        // MAIN SOUND AWAL
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
        // MULAI DETEKSI
        // =================================

        running = true;

        gestureTerakhir =
            "NORMAL";

        prosesKamera();

    }

    catch (error) {

        console.log(error);

        status.textContent =
            "Kamera gagal dibuka";

        alert(
            "Kamera tidak bisa dibuka. " +
            "Pastikan izin kamera diberikan."
        );

    }

}


// ========================================
// PROSES KAMERA
// ========================================

async function prosesKamera() {

    if (!running) {

        return;

    }


    try {

        await hands.send({

            image: video

        });

    }

    catch (error) {

        console.log(error);

    }


    requestAnimationFrame(
        prosesKamera
    );

}


// ========================================
// STOP KAMERA
// ========================================

function stopKamera() {

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
    // HILANGKAN BLUR
    // =================================

    video.classList.remove(
        "blur"
    );


    // =================================
    // STOP SOUND BLUR
    // =================================

    blurSound.pause();

    blurSound.currentTime = 0;


    // =================================
    // STOP SOUND AWAL
    // =================================

    suaraAwal.pause();

    suaraAwal.currentTime = 0;


    // =================================
    // RESET
    // =================================

    bolehBunyi = true;

    blurSedangJalan = false;


    if (timerBlur) {

        clearTimeout(timerBlur);

        timerBlur = null;

    }


    gestureTerakhir =
        "NORMAL";


    status.textContent =
        "Kamera belum aktif";

}


// ========================================
// TOMBOL
// ========================================

startBtn.addEventListener(
    "click",
    mulaiKamera
);


stopBtn.addEventListener(
    "click",
    stopKamera
);
