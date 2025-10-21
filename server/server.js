// server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ───────────────────── 기본 설정 ─────────────────────
const port = process.env.PORT || 4000;
const DEFAULT_ALLOWED = [
  "http://localhost:3000",
  "http://localhost:3001",
];
// 쉼표(,)로 여러 개 지정 가능: e.g. "https://frontend.vercel.app,https://another.app"
const ENV_ALLOWED = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...DEFAULT_ALLOWED, ...ENV_ALLOWED];

// Render/프록시 환경에서 req.protocol 정확히 잡히게
app.set("trust proxy", 1);

// ───────────────────── 미들웨어 ─────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// 업로드 폴더 보장 + 정적 제공
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// ───────────────────── 유틸 ─────────────────────
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

const SAVE_PATH = path.join(__dirname, "messages.json");

const saveMessagesToFile = () => {
  try {
    fs.writeFileSync(SAVE_PATH, JSON.stringify(messagesByUser, null, 2), "utf-8");
  } catch (e) {
    console.error("messages.json 저장 실패:", e.message);
  }
};

const loadMessagesFromFile = () => {
  try {
    if (fs.existsSync(SAVE_PATH)) {
      const raw = fs.readFileSync(SAVE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    }
  } catch (e) {
    console.error("messages.json 로드 실패:", e.message);
  }
  return {};
};

// ───────────────────── 상태 ─────────────────────
const messagesByUser = loadMessagesFromFile();
let userData = {
  nickname: "",
  phoneNumber: "",
  imageUrl: "",
};

// ───────────────────── 업로드 ─────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
});

// ───────────────────── 라우트 ─────────────────────
app.get("/healthz", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// 유저 정보
app.get("/me", (req, res) => {
  res.json(userData);
});

app.post("/login", (req, res) => {
  const { nickname } = req.body;
  userData.nickname = (nickname || "").trim();
  const key = userData.nickname || "guest";
  if (!messagesByUser[key]) {
    messagesByUser[key] = createDefaultMessages();
  }
  saveMessagesToFile();
  res.json({ success: true });
});

// 프로필 업로드 (프런트: formData.append("image", file))
app.post("/profile/image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  // 배포/프록시 환경에서도 정확한 호스트를 만들기
  const publicHost =
    process.env.PUBLIC_HOST || `${req.protocol}://${req.get("host")}`;
  userData.imageUrl = `${publicHost}/uploads/${req.file.filename}`;
  res.json({ imageUrl: userData.imageUrl });
});

app.post("/profile/phone", (req, res) => {
  const { phone } = req.body;
  userData.phoneNumber = phone || "";
  res.json({ success: true });
});

// 메시지 리스트
app.get("/messages", (req, res) => {
  const key = userData.nickname || "guest";
  if (!messagesByUser[key]) {
    messagesByUser[key] = createDefaultMessages();
  }
  res.json(messagesByUser[key]);
});

// 읽음 처리
app.post("/messages/read", (req, res) => {
  const key = userData.nickname || "guest";
  const { name } = req.body;
  if (!messagesByUser[key]) return res.status(400).json({ error: "User not found" });

  messagesByUser[key] = messagesByUser[key].map((m) =>
    m.name === name
      ? {
          ...m,
          unreadCount: 0,
          messages: (m.messages || []).map((msg) => ({ ...msg, read: true })),
        }
      : m
  );

  saveMessagesToFile();
  res.json({ success: true });
});

// 메시지 저장 (사용자/캐릭터 통합)
app.post("/messages/respond", (req, res) => {
  const { name, response, image, fromNpc, fromSakuya, fromYushi } = req.body;
  const key = userData.nickname || "guest";
  const now = getCurrentFormattedTime();

  if (!messagesByUser[key]) return res.status(400).json({ error: "User not found" });

  const chat = messagesByUser[key].find((m) => m.name === name);
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  // NPC(사쿠야/유우시/기타) 처리
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
    saveMessagesToFile();
    return res.json({ success: true });
  }

  // 사용자 메시지
  chat.messages.push({ sender: "me", text: response, time: now });
  chat.message = response;
  chat.time = now;

  saveMessagesToFile();
  res.json({ success: true });
});

// ───────────────────── 서버 시작 ─────────────────────
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  console.log(`   CORS allowed: ${ALLOWED_ORIGINS.join(", ") || "(none)"}`);
});
