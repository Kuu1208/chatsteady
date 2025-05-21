import React, { useEffect, useState } from "react";
import { ReactComponent as BackIcon } from "../icons/iconmonstr-arrow-64.svg";
import { ReactComponent as GalleryIcon } from "../icons/iconmonstr-picture-5.svg";
import axios from "axios";

const getCurrentFormattedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

const replyMap = {
  "갑자기? ㅋㅋ": ["거짓말이고", "나 요즘 고민이 있는데"],
  "뭔데?": ["나 고민이 있어"],
  "무슨 빵": ["사실은 고민이 있어서 .."],
};

const SakuyaChat = ({ onBack }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginTime] = useState(getCurrentFormattedTime());

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:4000/messages", {
      withCredentials: true,
    });
    const sakuya = res.data.find((m) => m.name === "사쿠야");
    setMessages(sakuya?.messages || []);
  };

  const handleResponse = async (text) => {
    const now = getCurrentFormattedTime();
    const userMessage = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, userMessage]);

    // 서버 저장
    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "사쿠야", response: text },
      { withCredentials: true }
    );

    // 로딩 표시 (약간 딜레이)
    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    let delay = 1000;

    // 1.5초 간격으로 하나씩 추가
    replies.forEach((replyText, idx) => {
      setTimeout(() => {
        const reply = {
          sender: "사쿠야",
          text: replyText,
          time: getCurrentFormattedTime(),
        };
        setMessages((prev) => [...prev, reply]);

        // 마지막 메시지일 경우 로딩 종료
        if (idx === replies.length - 1) {
          setIsLoading(false);
        }
      }, delay + idx * 1500);
    });
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">사쿠야</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" />
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}
          >
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img src="/images/사쿠야.jpg" alt="사쿠야" className="w-12 h-12 rounded-full mr-2" />
                <div>
                  <div className="text-sm font-semibold mb-1">사쿠야</div>
                  <div className="flex items-end">
                    <div className="bg-gray-200 text-black px-4 py-2 rounded-2xl">
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-500 ml-2">{msg.time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-end">
                <span className="text-[10px] text-gray-500 mr-2">{msg.time}</span>
                <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl">
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 로딩 애니메이션 */}
        {isLoading && (
          <div className="flex items-start">
            <img src="/images/사쿠야.jpg" alt="사쿠야" className="w-12 h-12 rounded-full mr-2" />
            <div className="bg-gray-200 px-4 py-2 rounded-2xl flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>

      {/* 선택지 */}
      {!isLoading && messages.length <= 1 && (
        <div className="p-4 border-t">
          <div className="text-center text-xs text-gray-600 mb-2">어떻게 답장할까요?</div>
          <div className="space-y-2">
            <button className="w-full py-2 rounded-xl border" onClick={() => handleResponse("갑자기? ㅋㅋ")}>
              갑자기? ㅋㅋ
            </button>
            <button className="w-full py-2 rounded-xl border" onClick={() => handleResponse("뭔데?")}>
              뭔데?
            </button>
            <button className="w-full py-2 rounded-xl border" onClick={() => handleResponse("무슨 빵")}>
              무슨 빵
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SakuyaChat;
