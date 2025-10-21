// server.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 4000;

// ─────────────────────────────────────────────────────────────────────────────
// 빌드 디렉토리 자동 탐지: ① 환경변수 ② ./build ③ ./client/build
// ─────────────────────────────────────────────────────────────────────────────
const pickClientBuildDir = () => {
  if (process.env.CLIENT_BUILD_DIR && fs.existsSync(process.env.CLIENT_BUILD_DIR)) {
    return process.env.CLIENT_BUILD_DIR;
  }
  const rootBuild = path.join(__dirname, "build");
  if (fs.existsSync(rootBuild)) return rootBuild;

  const clientBuild = path.join(__dirname, "client", "build");
  if (fs.existsSync(clientBuild)) return clientBuild;

  return null;
};
const CLIENT_BUILD_DIR = pickClientBuildDir();

// 프록시(리버스 프록시 환경)에서 req.protocol 계산 제대로 하려면
app.set("trust proxy", 1);

// 업로드 정적 URL prefix 절대경로 베이스(옵션)
// 예: https://chatsteady.onrender.com
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";

// CORS 허용 오리진
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // 예: https://chatsteady.vercel.app
].filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// 미들웨어
// ─────────────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, cb) {
      // 같은 도메인(SSR/브라우저 내 fetch) 요청은 origin이 비어 있음 → 허용
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // 배포 단일 도메인에서 쓰면 사실상 문제 없음. 필요하면 여기서 차단 로직 추가.
      return cb(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// 업로드 폴더(정적 서빙)
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// 클라이언트 빌드 정적 서빙
if (CLIENT_BUILD_DIR) {
  app.use(express.static(CLIENT_BUILD_DIR));
}

// ─────────────────────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────────────────────
const getCurrentFormattedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

// 요청 호스트 기반 절대 URL 생성 (PUBLIC_BASE_URL이 없으면)
const makeAbsoluteUrl = (req, relativePath) => {
  if (PUBLIC_BASE_URL) return `${PUBLIC_BASE_URL}${relativePath}`;
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");
  return `${proto}://${host}${relativePath}`;
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

// ─────────────────────────────────────────────────────────────────────────────
// 상태 (메모리 + 파일 저장)
// ─────────────────────────────────────────────────────────────────────────────
const messagesByUser = {}; // { [nickname]: Array<chat> }
const MESSAGES_FILE = path.join(__dirname, "messages.json");

const loadMessagesFromFile = () => {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, "utf-8");
      const data = JSON.parse(raw);
      Object.assign(messagesByUser, data);
    }
  } catch (e) {
    console.error("messages.json 로드 실패:", e.message);
  }
};
const saveMessagesToFile = () => {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messagesByUser, null, 2), "utf-8");
  } catch (e) {
    console.error("messages.json 저장 실패:", e.message);
  }
};

// 서버 시작 시 기존 대화 로드
loadMessagesFromFile();

// 간단한 유저 프로필(메모리)
let userData = {
  nickname: "",
  phoneNumber: "",
  imageUrl: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// 업로드
// ─────────────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 라우트
// ─────────────────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true, time: Date.now() }));

app.get("/me", (req, res) => {
  res.json(userData);
});

app.post("/login", (req, res) => {
  const { nickname } = req.body || {};
  userData.nickname = (nickname || "").trim();

  const key = userData.nickname || "guest";
  if (!messagesByUser[key]) {
    messagesByUser[key] = createDefaultMessages();
  }
  saveMessagesToFile();
  res.json({ success: true });
});

app.post("/profile/image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const filePath = `/uploads/${req.file.filename}`;
  userData.imageUrl = makeAbsoluteUrl(req, filePath); // 절대 URL 반환
  res.json({ imageUrl: userData.imageUrl });
});

app.post("/profile/phone", (req, res) => {
  const { phone } = req.body || {};
  userData.phoneNumber = phone || "";
  res.json({ success: true });
});

app.get("/messages", (req, res) => {
  const key = userData.nickname || "guest";
  if (!messagesByUser[key]) {
    messagesByUser[key] = createDefaultMessages();
  }
  res.json(messagesByUser[key]);
});

app.post("/messages/read", (req, res) => {
  const key = userData.nickname || "guest";
  const { name } = req.body || {};
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

app.post("/messages/respond", (req, res) => {
  const { name, response, image, fromSakuya, fromYushi, fromNpc } = req.body || {};
  const key = userData.nickname || "guest";
  const now = getCurrentFormattedTime();

  if (!messagesByUser[key]) return res.status(400).json({ error: "User not found" });
  const chat = messagesByUser[key].find((m) => m.name === name);
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  // NPC 메시지
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

// ─────────────────────────────────────────────────────────────────────────────
// SPA 라우팅 (클라이언트 빌드가 있는 경우에만)
// ─────────────────────────────────────────────────────────────────────────────
if (CLIENT_BUILD_DIR) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"));
  });
} else {
  // 빌드 없으면 404(JSON)로 응답 (API만 제공하는 모드)
  app.get("*", (req, res) => {
    res.status(404).json({ error: "No client build found. API only." });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  if (CLIENT_BUILD_DIR) {
    console.log(`📦 Serving client from: ${CLIENT_BUILD_DIR}`);
  } else {
    console.log("ℹ️ No client build found. API-only mode.");
  }
});
