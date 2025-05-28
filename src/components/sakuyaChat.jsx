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

const choiceMap = {
  "나 요즘 고민이 있는데": ["뭔데?", "너 알아서 해", "고민 들어주면 빵 주나"],
  "나 고민이 있어": ["뭐가 고민인데", "너 알아서 해", "고민 들어주면 빵 주나"],
  "사실은 고민이 있어서 ..": ["뭔데?", "너 알아서 해", "고민 들어주면 빵 주나"],
  "내가 요즘 좋아하는 사람이 있는데 ": ["헐헐 누구야", "너가 ?", "빵 아니지?"],

  "비밀인데 ...": ["누군데", "그래서 뭐 ㅡㅡ", "그래서 뭐 고백하려고 ?"],
  "ㅡㅡ": ["내가 아는 사람이야?", "알려줘", "그래서 고민이 뭔데"],
  "장난하나": ["미안 ㅋㅋ", "누구야 그래서", "그래서 고민이 뭔데 ?"],

  "암튼 내일 고백하려고 하는데 ..": ["내가 다 떨리네", "잘 될거야 ㅋㅋ", "떨지마 !!!"],
  "내일 고백하려고 하는데 ..": ["헐헐?", "어떻게 하려고", "내가 도와줘야 해?"],

  "너가 나 좀 도와줘": ["응응 나만 믿어!"],
  "나 좀 도와줄 수 있어?" : ["응응 나만 믿어!"],

  "어디로 불러내야 좋을까": ["빵 가게가 좋을 듯?", "솜사탕 가게가 귀여움", "카페가 젤 무난하지"]
};

const replyMap = {
  "갑자기? ㅋㅋ": ["장난이고", "나 요즘 고민이 있는데"],
  "뭐야 갑자기": ["나 고민이 있어"],
  "무슨 빵": ["장난이고", "사실은 고민이 있어서 .."],
  "뭔데?": ["사실은", "내가 요즘 좋아하는 사람이 있는데 "],

  "뭐가 고민인데": ["내가 요즘 좋아하는 사람이 있는데 "],
  "나 요즘 고민이 있는데": ["내가 요즘 좋아하는 사람이 있는데 "],
  "나 고민이 있어": ["내가 요즘 좋아하는 사람이 있는데 "],
  "사실은 고민이 있어서 ..": ["내가 요즘 좋아하는 사람이 있는데 "],

  "너 알아서 해": ["ㅡㅡ", "내가 요즘 좋아하는 사람이 있는데 "],
  "고민 들어주면 빵 주나": ["아니", "내가 요즘 좋아하는 사람이 있는데 "],

  "헐헐 누구야": ["비밀인데 ..."],
  "너가 ?": ["ㅡㅡ"],
  "빵 아니지?": ["장난하나"],

  "누군데": ["그건 비밀이고", "내일 고백하려고 하는데 .."],
  "그래서 뭐 ㅡㅡ": ["내일 고백하려고 하는데 .."],
  "그래서 뭐 고백하려고 ?": ["내일 고백하려고 하는데 .."],

  "내가 아는 사람이야?": ["비밀인데", "암튼 내일 고백하려고 하는데 .."],
  "알려줘": ["비밀인데", "내일 고백하려고 하는데 .."],
  "그래서 고민이 뭔데": ["내일 고백하려고 하는데 .."],

  "미안 ㅋㅋ": ["ㅡㅡ", "암튼 내일 고백하려고 하는데 .."],
  "누구야 그래서": ["비밀이야", "암튼 내일 고백하려고 하는데 .."],
  "그래서 고민이 뭔데 ?": ["내일 고백하려고 하는데 ..."],

  "내가 다 떨리네": ["나 좀 도와줄 수 있어?"],
  "잘 될거야 ㅋㅋ": ["나 좀 도와줄 수 있어?"],
  "떨지마 !!!": ["웅ㅋㅋ", "나 좀 도와줄 수 있어?"],

  "헐헐?": ["너가 나 좀 도와줘"],
  "어떻게 하려고": ["너가 나 좀 도와줘"],
  "내가 도와줘야 해?": ["너가 나 좀 도와줘"],

  "응응 나만 믿어!": ["imageSet"],

  "빵 가게가 좋을 듯?": [],
  "솜사탕 가게가 귀여움": [],
  "카페가 젤 무난하지": []
};

const SakuyaChat = ({ onBack }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
    const newMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, newMsg]);

    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "사쿠야", response: text },
      { withCredentials: true }
    );

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    let delay = 1000;

    if (replies.includes("imageSet")) {
      const imagePaths = [
        "/images/사쿠야_빵.jpg",
        "/images/사쿠야_솜사탕.jpg",
        "/images/사쿠야_커피.jpg",
      ];

      imagePaths.forEach((path, idx) => {
        setTimeout(() => {
          const reply = {
            sender: "사쿠야",
            image: path,
            time: getCurrentFormattedTime(),
          };
          setMessages((prev) => [...prev, reply]);
          if (idx === imagePaths.length - 1) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                { sender: "사쿠야", text: "빵 가게랑 솜사탕 가게랑 카페 중에", time: getCurrentFormattedTime() },
                { sender: "사쿠야", text: "어디로 불러내야 좋을까", time: getCurrentFormattedTime() },
              ]);
              setIsLoading(false);
            }, 1500);
          }
        }, delay + idx * 1500);
      });
      return;
    }

    replies.forEach((replyText, idx) => {
      setTimeout(() => {
        const reply = {
          sender: "사쿠야",
          text: replyText,
          time: getCurrentFormattedTime(),
        };
        setMessages((prev) => [...prev, reply]);
        if (idx === replies.length - 1) setIsLoading(false);
      }, delay + idx * 1500);
    });
  };

  const getChoices = () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.sender !== "사쿠야") return [];
    return choiceMap[lastMsg.text] || (messages.length <= 1
      ? ["갑자기? ㅋㅋ", "뭔데?", "무슨 빵"]
      : []);
  };

  const handleChoice = (text) => {
    handleResponse(text);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">사쿠야</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(true)} />
      </div>

      {/* 채팅 */}
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
                    {msg.image ? (
                      <img
                        src={msg.image}
                        alt="사쿠야 이미지"
                        className="max-w-[200px] rounded-xl"
                      />
                    ) : (
                      <div className="bg-gray-200 text-black px-4 py-2 rounded-2xl">
                        {msg.text}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500 ml-2">{msg.time}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-end">
                <span className="text-[10px] text-gray-500 mr-2">{msg.time}</span>
                <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl">{msg.text}</div>
              </div>
            )}
          </div>
        ))}

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

      {!isLoading && getChoices().length > 0 && (
        <div className="p-4 border-t">
          <div className="text-center text-xs text-gray-600 mb-2">어떻게 답장할까요?</div>
          <div className="space-y-2">
            {getChoices().map((choice, idx) => (
              <button
                key={idx}
                onClick={() => handleChoice(choice)}
                className="w-full py-2 rounded-xl border bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 갤러리 모달 */}
      {isGalleryOpen && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <BackIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(false)} />
            <div className="font-semibold text-base">사진 갤러리</div>
            <div className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 p-2">
            {messages.filter(m => m.image).map((msg, idx) => (
              <img
                key={idx}
                src={msg.image}
                alt={`이미지 ${idx}`}
                className="object-cover w-full h-24 rounded cursor-pointer"
                onClick={() => setSelectedImage(msg.image)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 전체 이미지 보기 */}
      {selectedImage && (
        <div
          className="absolute inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="선택된 이미지" className="max-w-full max-h-full rounded" />
        </div>
      )}
    </div>
  );
};

export default SakuyaChat;
