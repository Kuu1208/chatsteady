const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  process.env.FRONTEND_URL, // ex: "https://chatsteady-k522.vercel.app"
].filter(Boolean);

// 업로드 폴더 준비
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const CLIENT_BUILD_DIR = path.join(__dirname, "client", "build");
const hasClientBuild = fs.existsSync(CLIENT_BUILD_DIR);

// 미들웨어 설정
app.set("trust proxy", 1); // 프록시 뒤에 있을 때 secure 쿠키 처리
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // 서버->서버 요청 등
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // 개발 편의상 통과시키려면 true, 보안을 원하면 false로 바꿔서 차단
      return cb(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));
if (hasClientBuild) app.use(express.static(CLIENT_BUILD_DIR));

// 유틸: 현재 시간을 한국 형식으로 포맷팅 (한국 시간대 적용)
const getCurrentFormattedTime = () => {
  const now = new Date();
  // 한국 시간대로 변환 (UTC+9)
  const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const hour = koreaTime.getHours();
  const minute = koreaTime.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

// 기본 메시지 생성 (시간은 나중에 설정)
const createDefaultMessages = () => {
  return [
    {
      name: "시온",
      message: "뭐해?",
      image: "/images/시온.jpg",
      time: "",
      unreadCount: 1,
      messages: [{ sender: "시온", text: "뭐해?", time: "", read: false }],
    },
    {
      name: "리쿠",
      message: "지금 뭐해 ~",
      image: "/images/리쿠.jpg",
      time: "",
      unreadCount: 1,
      messages: [{ sender: "리쿠", text: "지금 뭐해 ~", time: "", read: false }],
    },
    {
      name: "유우시",
      message: "밥 먹었어?",
      image: "/images/유우시.jpg",
      time: "",
      unreadCount: 1,
      messages: [{ sender: "유우시", text: "밥 먹었어?", time: "", read: false }],
    },
    {
      name: "재희",
      message: "바빠?",
      image: "/images/재희.jpg",
      time: "",
      unreadCount: 1,
      messages: [{ sender: "재희", text: "바빠?", time: "", read: false }],
    },
    {
      name: "료",
      message: "뭐함?",
      image: "/images/료.jpg",
      time: "",
      unreadCount: 1,
      messages: [{ sender: "료", text: "뭐함?", time: "", read: false }],
    },
    {
      name: "사쿠야",
      message: "빵 먹으러 갈래?",
      image: "/images/사쿠야.jpg",
      time: "",
      unreadCount: 1,
      messages: [{ sender: "사쿠야", text: "빵 먹으러 갈래?", time: "", read: false }],
    },
  ];
};

// 세션 저장 (메모리)
const sessions = {}; // { sid: { userData: {...}, messages: [...] } }

// 세션 보장 미들웨어: sid 쿠키가 없으면 새로 발급 (세션 쿠키 — maxAge 미설정)
const ensureSession = (req, res, next) => {
  let { sid } = req.cookies || {};
  if (!sid) {
    sid = crypto.randomUUID();
    // 세션 쿠키(브라우저 닫으면 삭제): maxAge **설정하지 않음**
    res.cookie("sid", sid, {
      httpOnly: true,
      secure: isProd, // 프로덕션에서는 HTTPS 사용해야 True
      sameSite: isProd ? "None" : "Lax",
      // maxAge: undefined -> 세션 쿠키
    });
  }
  if (!sessions[sid]) {
    // 🔥 수정: 사용자 접속 시간 생성
    const joinTime = getCurrentFormattedTime();
    const defaultMsgs = createDefaultMessages();
    
    // 🔥 수정: 모든 초기 메시지에 접속 시간 설정
    defaultMsgs.forEach(chat => {
      chat.time = joinTime;
      chat.messages.forEach(msg => {
        msg.time = joinTime;
      });
    });
    
    sessions[sid] = {
      userData: { nickname: "", phoneNumber: "", imageUrl: "" },
      messages: defaultMsgs,
    };
  }
  req.session = sessions[sid];
  next();
};

app.use(ensureSession);

// multer 업로드 설정
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

// 라우트
app.get("/health", (_, res) => res.json({ ok: true, time: Date.now() }));

// 내 정보
app.get("/me", (req, res) => {
  // 세션의 userData 반환 (닉네임/전화/프로필)
  res.json(req.session.userData);
});

// 로그인(닉네임 저장)
app.post("/login", (req, res) => {
  const { nickname } = req.body || {};
  req.session.userData.nickname = (nickname || "").trim();
  res.json({ success: true });
});

// 프로필 이미지 업로드
app.post("/profile/image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const filePath = `/uploads/${req.file.filename}`;
  // 절대 URL로 만들고 싶으면 makeAbsoluteUrl(req, filePath) 구현해서 사용하세요.
  const absoluteUrl = `${req.protocol}://${req.get("host")}${filePath}`;
  req.session.userData.imageUrl = absoluteUrl;
  res.json({ imageUrl: req.session.userData.imageUrl });
});

// 전화 저장
app.post("/profile/phone", (req, res) => {
  const { phone } = req.body || {};
  req.session.userData.phoneNumber = phone || "";
  res.json({ success: true });
});

// 메시지 목록
app.get("/messages", (req, res) => {
  res.json(req.session.messages || []);
});

// 읽음 처리
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

// 메시지 저장 (사용자 & NPC)
app.post("/messages/respond", (req, res) => {
  const { name, response, image, fromSakuya, fromYushi, fromNpc } = req.body || {};
  const list = req.session.messages || [];
  const now = getCurrentFormattedTime();

  const chat = list.find((m) => m.name === name);
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
    return res.json({ success: true });
  }

  // 사용자 메시지
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