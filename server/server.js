const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 4000;

// ───────────────────── 미들웨어 ─────────────────────
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ["http://localhost:3000", "http://localhost:3001"];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ───────────────────── 유틸 함수 ─────────────────────
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
      messages: [{ sender: "시온", text: "뭐해?", time, read: false }]
    },
    {
      name: "리쿠",
      message: "지금 뭐해 ~",
      image: "/images/리쿠.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "리쿠", text: "지금 뭐해 ~", time, read: false }]
    },
    {
      name: "유우시",
      message: "밥 먹었어?",
      image: "/images/유우시.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "유우시", text: "밥 먹었어?", time, read: false }]
    },
    {
      name: "재희",
      message: "바빠?",
      image: "/images/재희.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "재희", text: "바빠?", time, read: false }]
    },
    {
      name: "료",
      message: "뭐함?",
      image: "/images/료.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "료", text: "뭐함?", time, read: false }]
    },
    {
      name: "사쿠야",
      message: "빵 먹으러 갈래?",
      image: "/images/사쿠야.jpg",
      time,
      unreadCount: 1,
      messages: [{ sender: "사쿠야", text: "빵 먹으러 갈래?", time, read: false }]
    }
  ];
};

// ───────────────────── 상태 저장소 ─────────────────────
const messagesByUser = {};
let userData = {
  nickname: "",
  phoneNumber: "",
  imageUrl: "",
};

// ───────────────────── 업로드 설정 ─────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "uploads");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
});

// ───────────────────── 라우팅 ─────────────────────

// 로그인/유저정보
app.get("/me", (req, res) => {
  res.json(userData);
});

app.post("/login", (req, res) => {
  const { nickname } = req.body;
  userData.nickname = nickname;
  if (!messagesByUser[nickname]) {
    messagesByUser[nickname] = createDefaultMessages();
  }
  res.json({ success: true });
});

app.post("/profile/image", upload.single("profile"), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  userData.imageUrl = `http://localhost:4000${filePath}`;
  res.json({ imageUrl: userData.imageUrl });
});

app.post("/profile/phone", (req, res) => {
  const { phone } = req.body;
  userData.phoneNumber = phone;
  res.json({ success: true });
});

// 메시지 관련
app.get("/messages", (req, res) => {
  const username = userData.nickname || "guest";
  if (!messagesByUser[username]) {
    messagesByUser[username] = createDefaultMessages();
  }
  res.json(messagesByUser[username]);
});

app.post("/messages/read", (req, res) => {
  const username = userData.nickname || "guest";
  const { name } = req.body;

  if (!messagesByUser[username]) return res.status(400).json({ error: "User not found" });

  messagesByUser[username] = messagesByUser[username].map(m =>
    m.name === name
      ? {
          ...m,
          unreadCount: 0,
          messages: m.messages.map(msg => ({ ...msg, read: true })),
        }
      : m
  );

  res.json({ success: true });
});

app.post("/messages/respond", (req, res) => {
  const { name, response } = req.body;
  const username = userData.nickname || "guest";
  const now = getCurrentFormattedTime();

  if (!messagesByUser[username]) return res.status(400).json({ error: "User not found" });

  const chat = messagesByUser[username].find(m => m.name === name);
  if (!chat) return res.status(404).json({ error: "Chat not found" });

  // 사용자 응답 저장
  chat.messages.push({ sender: "me", text: response, time: now });
  chat.message = response;
  chat.time = now;

  // 사쿠야 응답 정의
  const replies = {
    "갑자기? ㅋㅋ": ["거짓말이고", "나 요즘 고민이 있는데"],
    "뭔데?": ["나 고민이 있어"],
    "무슨 빵": ["사실은 고민이 있어서 .."]
  };

  const selectedReplies = replies[response] || [];

  // 사쿠야 응답을 시간차 두고 추가
  selectedReplies.forEach((text, idx) => {
    setTimeout(() => {
      const t = getCurrentFormattedTime();
      chat.messages.push({ sender: name, text, time: t });
      chat.message = text;
      chat.time = t;
    }, 1500 * (idx + 1));
  });

  res.json({ success: true });
});

// ───────────────────── 서버 시작 ─────────────────────
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});
