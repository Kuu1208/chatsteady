const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 4000;

// 클라이언트 빌드 경로(있으면 사용)
const CLIENT_BUILD_DIR =
  process.env.CLIENT_BUILD_DIR || path.join(__dirname, "client", "build");

// 업로드 파일 접근 시 절대 URL 기본값
// (설정 없으면 요청마다 req.protocol + host 기준으로 생성)
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
      // SSR/같은 도메인 요청(origin 없음) 허용
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // 필요하면 아래 주석 해제로 차단 가능
      // return cb(new Error(`Not allowed by CORS: ${origin}`));
      return cb(null, true); // 배포 단일 도메인이라면 크게 문제 없음
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// 업로드 폴더 정적 서빙
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// 클라이언트 빌드가 있을 경우 정적 서빙
const hasClientBuild = fs.existsSync(CLIENT_BUILD_DIR);
if (hasClientBuild) {
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

// 요청 호스트 기반 절대 URL 생성 (PUBLIC_BASE_URL이 없을 때 사용)
const makeAbsoluteUrl = (req, relativePath) => {
  if (PUBLIC_BASE_URL) return `${PUBLIC_BASE_URL}${relativePath}`;
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
      // 기존 객체에 병합
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

// 서버 시작 시 파일에서 기존 대화 로드
loadMessagesFromFile();

// 로그인한 유저 프로필
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
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// 라우트
// ─────────────────────────────────────────────────────────────────────────────
// 헬스체크(옵션)
app.get("/health", (_, res) => res.json({ ok: true, time: Date.now() }));

// 유저 정보
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

// 프로필 이미지 업로드
app.post("/profile/image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });

  const filePath = `/uploads/${req.file.filename}`;
  // 절대 URL 구성
  userData.imageUrl = makeAbsoluteUrl(req, filePath);
  res.json({ imageUrl: userData.imageUrl });
});

// 전화 저장
app.post("/profile/phone", (req, res) => {
  const { phone } = req.body || {};
  userData.phoneNumber = phone || "";
  res.json({ success: true });
});

// 메시지 목록
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

// 메시지 저장 (사용자/캐릭터 통합)
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
if (hasClientBuild) {
  app.get("*", (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
  if (hasClientBuild) {
    console.log(`📦 Serving client from: ${CLIENT_BUILD_DIR}`);
  } else {
    console.log("ℹ️ No client build found. API-only mode.");
  }
});
