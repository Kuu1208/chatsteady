// src/components/jaeheeChat.jsx
import React, { useEffect, useMemo, useState } from "react";
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

const outfitLabel = (o) => {
  if (o === "맨투맨") return "맨투맨";
  if (o === "안경") return "안경";
  if (o === "져지") return "져지";
  return o || "";
};
const placeLabel = (p) => p || "";

/* 선택지 */
const choiceMap = {
  "시간 좀 내줘..🥲": ["ㅋㅋㅋㅋㅋ알았어"],
  "잠깐만 시간 좀 내줘 ㅎㅎ": ["알았어!"],

  "잠깐만 도와주면 안돼?": ["응응 나만 믿어!"],

  "어디서 만나자고 하는게 좋아??": [
    "너 노래 잘하니까 노래방",
    "동물원 좋은데??",
    "쇼핑이 무난하고 괜찮음",
  ],

  "옷은 어때?": ["맨투맨 나쁘지 않아", "안경 잘어울려", "져지가 괜찮은데"],
};

/* 응답 흐름 */
const replyMap = {
  // 시작
  "바빠 죽겠다... 왜": ["에이", "진짜 잠깐만", "시간 좀 내줘..🥲"],
  "아니 한가해 !!": ["아 다행이다", "그러면", "잠깐만 시간 좀 내줘 ㅎㅎ"],

  "ㅋㅋㅋㅋㅋ알았어": ["사실은", "내일 좋아하는 애한테", "고백하려고 하는데", "잠깐만 도와주면 안돼?"],
  "알았어!": ["아니 그냥", "내일 좋아하는 애한테", "고백하려고 하는데", "잠깐만 도와주면 안돼?"],

  "응응 나만 믿어!": ["고마워용", "일단은", "imageSet60"],

  "너 노래 잘하니까 노래방": ["그럴까 ㅎㅎ", "옷은 어때?", "imageSet70"],
  "동물원 좋은데??": ["그치 ㅋㅋㅋㅋ", "옷은 어때?", "imageSet70"],
  "쇼핑이 무난하고 괜찮음": ["알았습니다요~", "옷은 어때?", "imageSet70"],

  "맨투맨 나쁘지 않아": ["그래??", "아 근데 뭐라고 말하지", "너무 떨리는데", "뭐라고 말하는게 좋아?"],
  "안경 잘어울려": ["알았엉", "아 근데 뭐라고 말하지", "너무 떨리는데", "뭐라고 말하는게 좋아?"],
  "져지가 괜찮은데": ["고마워 ㅋㅋㅋ", "아 근데 뭐라고 말하지", "너무 떨리는데", "뭐라고 말하는게 좋아?"],
};

const JaeheeChat = ({ onBack, userName }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confessionInput, setConfessionInput] = useState("");

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);

  const displayName = useMemo(() => {
    try {
      const saved = (localStorage.getItem("userName") || "").trim();
      return (userName || saved || "").trim();
    } catch {
      return (userName || "").trim();
    }
  }, [userName]);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveJaeheeMessage = async (msg) => {
    await axios.post(
      "http://localhost:4000/messages/respond",
      {
        name: "재희",
        response: msg.text || "",
        image: msg.image || "",
        fromNpc: true,
      },
      { withCredentials: true }
    );
  };

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:4000/messages", { withCredentials: true });
    const jaehee = res.data.find((m) => m.name === "재희");
    const initial = jaehee?.messages || [];
    if (initial.length === 0) {
      const first = { sender: "재희", text: "바빠?", time: getCurrentFormattedTime() };
      setMessages([first]);
      await saveJaeheeMessage(first);
    } else {
      setMessages(initial);
    }
  };

  const handleResponse = async (text) => {
    const now = getCurrentFormattedTime();
    const newMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, newMsg]);

    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "재희", response: text },
      { withCredentials: true }
    );

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    const textReplies = replies.filter(
      (r) => !(r || "").toString().trim().toLowerCase().startsWith("imageset")
    );
    const imageSetKey = (replies.find((r) =>
      (r || "").toString().trim().toLowerCase().startsWith("imageset")
    ) || "").trim();

    // 텍스트 답변 처리
    if (textReplies.length > 0) {
      textReplies.forEach((replyText, idx) => {
        setTimeout(async () => {
          const reply = { sender: "재희", text: replyText, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveJaeheeMessage(reply);
          if (idx === textReplies.length - 1 && !imageSetKey) setIsLoading(false);
        }, 1000 + idx * 1500);
      });
    }

    // 장소 이미지 세트
    if (imageSetKey === "imageset60" || imageSetKey === "imageSet60") {
      const imagePaths = ["/images/재희_노래방.jpg", "/images/재희_동물원.jpg", "/images/재희_쇼핑.jpg"];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "재희", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveJaeheeMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp1 = { sender: "재희", text: "노래방이랑 동물원이랑 쇼핑몰 중에서", time: getCurrentFormattedTime() };
              const followUp2 = { sender: "재희", text: "어디서 만나자고 하는게 좋아??", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp1, followUp2]);
              await saveJaeheeMessage(followUp1);
              await saveJaeheeMessage(followUp2);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }
    // 옷 이미지 세트
    else if (imageSetKey === "imageset70" || imageSetKey === "imageSet70") {
      const imagePaths = [
        "/images/재희_옷/재희_맨투맨.jpg",
        "/images/재희_옷/재희_안경.jpg",
        "/images/재희_옷/재희_져지.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "재희", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveJaeheeMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp = { sender: "재희", text: "옷은 어때?", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp]);
              await saveJaeheeMessage(followUp);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    } else if (textReplies.length === 0) {
      // 텍스트도 이미지셋도 없을 때 로딩 끔
      setIsLoading(false);
    }
  };

  const lastMsg = messages[messages.length - 1];
  const isConfessionStep =
    lastMsg?.sender !== "me" && lastMsg?.text === "뭐라고 말하는게 좋아?";

  const handleConfessionSubmit = async () => {
    const text = confessionInput.trim();
    if (!text) return;

    const now = getCurrentFormattedTime();
    const myMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, myMsg]);
    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "재희", response: text },
      { withCredentials: true }
    );

    setConfessionInput("");
    setIsLoading(true);

    const clean = text.replace(/^["'“”]|["'“”]$/g, "");

    const msg1 = { sender: "재희", text: "진짜 고마워ㅎㅎ", time: getCurrentFormattedTime() };
    const msg2 = (displayName || "").trim()
      ? { sender: "재희", text: `${(displayName || "").trim()}`, time: getCurrentFormattedTime() }
      : null;
    const msg3 = { sender: "재희", text: clean, time: getCurrentFormattedTime() };

    const t1 = 800;
    const t2 = msg2 ? 1600 : null;
    const t3 = msg2 ? 2400 : 1600;

    setTimeout(async () => {
      setMessages((p) => [...p, msg1]);
      await saveJaeheeMessage(msg1);
    }, t1);

    if (msg2) {
      setTimeout(async () => {
        setMessages((p) => [...p, msg2]);
        await saveJaeheeMessage(msg2);
      }, t2);
    }

    setTimeout(async () => {
      setMessages((p) => [...p, msg3]);
      await saveJaeheeMessage(msg3);

      if (selectedPlace && typeof selectedOutfit === "string") {
        const msg4 = {
          sender: "재희",
          text: `내일 ${outfitLabel(selectedOutfit)} 차림으로 ${placeLabel(selectedPlace)}에서 기다리고 있을게.`,
          time: getCurrentFormattedTime(),
        };
        setTimeout(async () => {
          setMessages((p) => [...p, msg4]);
          await saveJaeheeMessage(msg4);
          setIsLoading(false);
        }, 1000);
      } else {
        setIsLoading(false);
      }
    }, t3);
  };

  const getChoices = () => {
    const last = messages[messages.length - 1];
    if (!last || last.sender === "me") return [];
    // 첫 멘트 선택지
    if (messages.length === 1 && (last.text || "").trim() === "바빠?") {
      return ["바빠 죽겠다... 왜", "아니 한가해 !!"];
    }
    return choiceMap[last.text] || [];
  };

  const handleChoice = (text) => {
    // 장소 선택
    if (text === "너 노래 잘하니까 노래방") setSelectedPlace("노래방");
    if (text === "동물원 좋은데??") setSelectedPlace("동물원");
    if (text === "쇼핑이 무난하고 괜찮음") setSelectedPlace("쇼핑몰");

    // 옷 선택
    if (text === "맨투맨 나쁘지 않아") setSelectedOutfit("맨투맨");
    if (text === "안경 잘어울려") setSelectedOutfit("안경");
    if (text === "져지가 괜찮은데") setSelectedOutfit("져지");

    handleResponse(text);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">재희</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(true)} />
      </div>

      {/* 채팅 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}>
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img
                  src="/images/재희.jpg"
                  alt="재희"
                  className="w-12 h-12 rounded-full mr-2"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "/images/재희.png";
                  }}
                />
                <div>
                  <div className="text-sm font-semibold mb-1">재희</div>
                  <div className="flex items-end">
                    {msg.image ? (
                      <img src={msg.image} alt="재희 이미지" className="max-w-[200px] rounded-xl" />
                    ) : (
                      <div className="bg-gray-200 text-black px-4 py-2 rounded-2xl">{msg.text}</div>
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
            <img
              src="/images/재희.jpg"
              alt="재희"
              className="w-12 h-12 rounded-full mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/재희.png";
              }}
            />
            <div className="bg-gray-200 px-4 py-2 rounded-2xl flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>

      {/* 하단 입력/선택 */}
      {!isLoading && (isConfessionStep || getChoices().length > 0) && (
        <div className="p-4 border-t">
          {isConfessionStep ? (
            <>
              <div className="text-center text-xs text-gray-600 mb-2">고백 멘트를 입력해줘!</div>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-xl px-3 py-2"
                  placeholder='예: 그냥 "나랑 사귀자" 라고 해봐'
                  value={confessionInput}
                  onChange={(e) => setConfessionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfessionSubmit()}
                />
                <button onClick={handleConfessionSubmit} className="px-4 py-2 rounded-xl bg-blue-500 text-white">
                  보내기
                </button>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {isGalleryOpen && (
        <div className="absolute inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <BackIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(false)} />
            <div className="font-semibold text-base">사진 갤러리</div>
            <div className="w-5 h-5" />
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2 p-2">
            {messages
              .filter((m) => m.image)
              .map((msg, idx) => (
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

export default JaeheeChat;
