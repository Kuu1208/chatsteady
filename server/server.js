const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

process.env.TZ = "Asia/Seoul";


const app = express();
const port = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

// 프런트(브라우저) 도메인 – Vercel 주소 넣어줘야 쿠키가 cross-site로 붙음
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://chatsteady-k522.vercel.app",
  process.env.FRONTEND_URL, // 예: https://chatsteady-k522.vercel.app
].filter(Boolean);

// 업로드 폴더
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// (옵션) 클라이언트 빌드를 같은 서버에서 서빙할 경우만 사용
const CLIENT_BUILD_DIR = path.join(__dirname, "client", "build");
const hasClientBuild = fs.existsSync(CLIENT_BUILD_DIR);

// ───────────────────── 미들웨어 ─────────────────────
app.set("trust proxy", 1); // Render/프록시 뒤에 있을 때 secure 쿠키 인식
app.use(
  cors({
    origin(origin, cb) {
      // 서버→서버 호출(origin 없음)도 허용
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));
if (hasClientBuild) app.use(express.static(CLIENT_BUILD_DIR));

// ───────────────────── 유틸 ─────────────────────
const getCurrentFormattedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

const makeAbsoluteUrl = (req, relativePath) => {
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${relativePath}`;
};

const createDefaultMessages = () => {
  const time = getCurrentFormattedTime();
  return [
    {
      name: "시온",
      message: "뭐해?",
      image: "/images/시온.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "시온", text: "뭐해?", time, read: false }],
    },
    {
      name: "리쿠",
      message: "지금 뭐해 ~",
      image: "/images/리쿠.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "리쿠", text: "지금 뭐해 ~", time, read: false }],
    },
    {
      name: "유우시",
      message: "밥 먹었어?",
      image: "/images/유우시.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "유우시", text: "밥 먹었어?", time, read: false }],
    },
    {
      name: "재희",
      message: "바빠?",
      image: "/images/재희.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "재희", text: "바빠?", time, read: false }],
    },
    {
      name: "료",
      message: "뭐함?",
      image: "/images/료.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "료", text: "뭐함?", time, read: false }],
    },
    {
      name: "사쿠야",
      message: "빵 먹으러 갈래?",
      image: "/images/사쿠야.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "사쿠야", text: "빵 먹으러 갈래?", time, read: false }],
    },
  ];
};

const sessions = {}; // { sid: { userData, messages } }

const ensureSession = (req, res, next) => {
  let { sid } = req.cookies || {};

  if (!sid) {
    sid = crypto.randomUUID();

    res.cookie("sid", sid, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      
    });
  }

  // 🔹 세션 메모리에 없으면 초기화
  if (!sessions[sid]) {
    sessions[sid] = {
      userData: { nickname: "", phoneNumber: "", imageUrl: "" },
      messages: createDefaultMessages(),
    };
  }

  req.session = sessions[sid];
  next();
};

app.use(ensureSession);

// ───────────────────── 업로드 ─────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

// ───────────────────── 라우트 ─────────────────────
app.get("/health", (_, res) => res.json({ ok: true, time: Date.now() }));

app.get("/me", (req, res) => {
  res.json(req.session.userData);
});

app.post("/login", (req, res) => {
  const { nickname } = req.body || {};
  req.session.userData.nickname = (nickname || "").trim();
  // 로그인 시에도 각 세션은 이미 분리되어 있음
  return res.json({ success: true });
});

app.post("/profile/image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const filePath = `/uploads/${req.file.filename}`;
  req.session.userData.imageUrl = makeAbsoluteUrl(req, filePath);
  res.json({ imageUrl: req.session.userData.imageUrl });
});

app.post("/profile/phone", (req, res) => {
  const { phone } = req.body || {};
  req.session.userData.phoneNumber = phone || "";
  res.json({ success: true });
});

app.get("/messages", (req, res) => {
  res.json(req.session.messages || []);
});

app.post("/messages/read", (req, res) => {
  const { name } = req.body || {};
  const list = req.session.messages || [];
  req.session.messages = list.map((m) =>
    m.name === name
      ? { ...m, unreadCount: 0, messages: (m.messages || []).map((msg) => ({ ...msg, read: true })) }
      : m
  );
  res.json({ success: true });
});

app.post("/messages/respond", (req, res) => {
  const { name, response, image, fromSakuya, fromYushi, fromNpc } = req.body || {};
  const list = req.session.messages || [];
  const now = getCurrentFormattedTime();

  const chat = list.find((m) => m.name === name);
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  // NPC
  if (fromNpc || fromSakuya || fromYushi) {
    const npcMsg = {
      sender: name,
      ...(response && { text: response }),
      ...(image && { image }),
      time: now,
    };
    chat.messages.push(npcMsg);
    chat.message = response || "사진을 보냈습니다";
    chat.time = now;
    return res.json({ success: true });
  }

  // 사용자
  chat.messages.push({ sender: "me", text: response, time: now });
  chat.message = response;
  chat.time = now;
  return res.json({ success: true });
});

if (hasClientBuild) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  if (hasClientBuild) {
    console.log(`📦 Serving client from: ${CLIENT_BUILD_DIR}`);
  } else {
    console.log("ℹ️ No client build found. API-only mode.");
  }
});
