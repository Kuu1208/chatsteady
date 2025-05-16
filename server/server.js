const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 4000;

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 메시지 파일 경로
const MESSAGE_FILE = path.join(__dirname, "messages.json");

// 현재 시각 포맷 함수
function getCurrentFormattedTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
}

// 초기 메시지
const DEFAULT_MESSAGES = [
  {
    name: "시온",
    message: "뭐해?",
    image: "/images/시온.jpg",
    time: getCurrentFormattedTime(),
    unreadCount: 1,
    messages: [{ sender: "시온", text: "뭐해?", read: false }]
  },
  {
    name: "리쿠",
    message: "지금 뭐해 ~",
    image: "/images/리쿠.jpg",
    time: getCurrentFormattedTime(),
    unreadCount: 1,
    messages: [{ sender: "리쿠", text: "지금 뭐해 ~", read: false }]
  },
  {
    name: "유우시",
    message: "밥 먹었어?",
    image: "/images/유우시.jpg",
    time: getCurrentFormattedTime(),
    unreadCount: 1,
    messages: [{ sender: "유우시", text: "밥 먹었어?", read: false }]
  },
  {
    name: "재희",
    message: "바빠?",
    image: "/images/재희.jpg",
    time: getCurrentFormattedTime(),
    unreadCount: 1,
    messages: [{ sender: "재희", text: "바빠?", read: false }]
  },
  {
    name: "료",
    message: "뭐함?",
    image: "/images/료.jpg",
    time: getCurrentFormattedTime(),
    unreadCount: 1,
    messages: [{ sender: "료", text: "뭐함?", read: false }]
  },
  {
    name: "사쿠야",
    message: "빵 먹으러 갈래?",
    image: "/images/사쿠야.jpg",
    time: getCurrentFormattedTime(),
    unreadCount: 1,
    messages: [{ sender: "사쿠야", text: "빵 먹으러 갈래?", read: false }]
  }
];

// 메시지 로드 및 저장
function loadMessages() {
  if (fs.existsSync(MESSAGE_FILE)) {
    return JSON.parse(fs.readFileSync(MESSAGE_FILE, "utf-8"));
  }
  return [...DEFAULT_MESSAGES];
}

function saveMessages(data) {
  fs.writeFileSync(MESSAGE_FILE, JSON.stringify(data, null, 2));
}

// 메시지 상태
let messages = loadMessages();

// 유저 정보
let userData = {
  nickname: "",
  phoneNumber: "",
  imageUrl: "",
};

// 이미지 업로드
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    },
  }),
});

// 라우트들

app.get("/me", (req, res) => {
  res.json(userData);
});

app.post("/login", (req, res) => {
  const { nickname } = req.body;
  userData.nickname = nickname;
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

// ✅ 메시지 목록 조회
app.get("/messages", (req, res) => {
  res.json(messages);
});

// ✅ 메시지 읽음 처리
app.post("/messages/read", (req, res) => {
  const { name } = req.body;
  messages = messages.map(m =>
    m.name === name
      ? {
          ...m,
          unreadCount: 0,
          messages: m.messages.map(msg => ({ ...msg, read: true })),
        }
      : m
  );
  saveMessages(messages);
  res.json({ success: true });
});

// 서버 시작
app.listen(port, () => {
  console.log(`✅ Server listening at http://localhost:${port}`);
});
