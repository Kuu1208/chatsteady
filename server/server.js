// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 4000;

/* =========================
   0. MongoDB 연결
========================= */
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI 환경변수를 설정하세요.");
  process.exit(1);
}

mongoose.set("strictQuery", false);
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

/* =========================
   1. 스키마/모델
========================= */
const MessageSchema = new mongoose.Schema(
  {
    sender: String,            // "me" | 캐릭터명
    text: String,
    image: String,
    time: String,              // "오전 10:02" 같은 형식
    read: { type: Boolean, default: false },
  },
  { _id: false }
);

const ChatSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },        // 캐릭터명 (시온, 리쿠...)
    message: String,                                // 리스트에 보이는 마지막 미리보기 텍스트
    image: String,                                  // 캐릭터 썸네일 경로
    time: String,                                   // 마지막 대화 시간
    unreadCount: { type: Number, default: 0 },
    messages: { type: [MessageSchema], default: [] }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    nickname: { type: String, unique: true, required: true },
    phoneNumber: String,
    imageUrl: String,
    chats: { type: [ChatSchema], default: [] }
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

/* =========================
   2. 유틸/기본값
========================= */
const getCurrentFormattedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
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

// nickname으로 유저 문서 보장 (없으면 생성)
async function ensureUser(nickname) {
  const key = nickname || "guest";
  let user = await User.findOne({ nickname: key });
  if (!user) {
    user = await User.create({
      nickname: key,
      phoneNumber: "",
      imageUrl: "",
      chats: createDefaultMessages(),
    });
  }
  return user;
}

/* =========================
   3. 미들웨어
========================= */
const isProd = process.env.NODE_ENV === "production";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://chatsteady-k522.vercel.app"; // Vercel 프론트 URL
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // 필요 시 차단 로직으로 바꿔도 됨
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

/* 파일 업로드(프로필 이미지) */
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
});

/* 클라이언트 빌드(선택) - 같은 서버에서 정적서빙할 때만 */
const CLIENT_BUILD_DIR = process.env.CLIENT_BUILD_DIR || path.join(__dirname, "client", "build");
const hasClientBuild = fs.existsSync(CLIENT_BUILD_DIR);
if (hasClientBuild) {
  app.use(express.static(CLIENT_BUILD_DIR));
}

/* 요청에서 닉네임 쿠키 파기 */
function getNickname(req) {
  return (req.cookies?.nickname || "").trim() || "guest";
}

/* 절대 URL 생성 (업로드 파일 반환용) */
function makeAbsoluteUrl(req, relativePath) {
  if (process.env.PUBLIC_BASE_URL) return `${process.env.PUBLIC_BASE_URL}${relativePath}`;
  const base = `${req.protocol}://${req.get("host")}`;
  return `${base}${relativePath}`;
}

/* =========================
   4. 라우트
========================= */
// 헬스체크
app.get("/health", (_, res) => res.json({ ok: true, time: Date.now() }));

// 현재 로그인 유저 정보
app.get("/me", async (req, res) => {
  const nickname = getNickname(req);
  const user = await ensureUser(nickname);
  res.json({
    nickname: user.nickname,
    phoneNumber: user.phoneNumber,
    imageUrl: user.imageUrl,
  });
});

// 로그인 -> nickname 쿠키 심기
app.post("/login", async (req, res) => {
  const { nickname } = req.body || {};
  const nk = (nickname || "").trim() || "guest";

  const cookieOptions = {
    httpOnly: false,                  // 프론트에서 읽게 할거면 false (이미 그렇게 쓰고 있음)
    secure: isProd,                   // https 환경에서만 쿠키 전송
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1년
  };
  res.cookie("nickname", nk, cookieOptions);
  await ensureUser(nk);
  res.json({ success: true });
});

// 프로필 이미지 업로드
app.post("/profile/image", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const nickname = getNickname(req);
  const user = await ensureUser(nickname);

  const filePath = `/uploads/${req.file.filename}`;
  const imageUrl = makeAbsoluteUrl(req, filePath);

  user.imageUrl = imageUrl;
  await user.save();

  res.json({ imageUrl });
});

// 전화번호 저장
app.post("/profile/phone", async (req, res) => {
  const nickname = getNickname(req);
  const user = await ensureUser(nickname);

  user.phoneNumber = (req.body?.phone || "").trim();
  await user.save();

  res.json({ success: true });
});

// 메시지 리스트
app.get("/messages", async (req, res) => {
  const nickname = getNickname(req);
  const user = await ensureUser(nickname);
  res.json(user.chats || []);
});

// 읽음 처리
app.post("/messages/read", async (req, res) => {
  const nickname = getNickname(req);
  const { name } = req.body || {};
  const user = await ensureUser(nickname);

  user.chats = (user.chats || []).map((c) =>
    c.name === name
      ? {
          ...c.toObject(),
          unreadCount: 0,
          messages: (c.messages || []).map((m) => ({ ...m, read: true })),
        }
      : c
  );

  await user.save();
  res.json({ success: true });
});

// 메시지 저장 (사용자/캐릭터 통합)
app.post("/messages/respond", async (req, res) => {
  const nickname = getNickname(req);
  const { name, response, image, fromSakuya, fromYushi, fromNpc } = req.body || {};
  const user = await ensureUser(nickname);
  const now = getCurrentFormattedTime();

  const idx = (user.chats || []).findIndex((c) => c.name === name);
  if (idx === -1) return res.status(404).json({ error: "Chat not found" });

  const chat = user.chats[idx];

  // NPC (캐릭터) 메시지
  if (fromNpc || fromSakuya || fromYushi) {
    const npcMsg = {
      sender: name,
      ...(response && { text: response }),
      ...(image && { image }),
      time: now,
      read: false,
    };
    chat.messages.push(npcMsg);
    chat.message = response || "사진을 보냈습니다";
    chat.time = now;
    chat.unreadCount = Math.max(0, (chat.unreadCount || 0)); // 필요시 조정
  } else {
    // 사용자 메시지
    chat.messages.push({ sender: "me", text: response, time: now, read: true });
    chat.message = response;
    chat.time = now;
  }

  user.chats[idx] = chat;
  await user.save();

  res.json({ success: true });
});

/* SPA 라우팅(선택) */
if (hasClientBuild) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"));
  });
}

/* =========================
   5. 서버 시작
========================= */
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  if (hasClientBuild) {
    console.log(`📦 Serving client from: ${CLIENT_BUILD_DIR}`);
  }
});
