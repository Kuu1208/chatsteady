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
  if (o === "검정 티셔츠") return "검정 티셔츠";
  if (o === "나시") return "나시";
  if (o === "흰 티셔츠") return "흰 티셔츠";
  return o || "";
};
const placeLabel = (p) => p || "";

/* 선택지 */
const choiceMap = {
  "고민되는게 있는데": ["어어 말해봐"],
  "나랑 잠깐 얘기 좀 해줘": ["싫어", "음 그래"],

  "잠깐만 도와줘": ["응응 나만 믿어!"],

  "어디가 좋을 것 같아??": ["놀이공원 꽤괜", "아직 더우니까 아이스크림", "인형 싫어하는 애 못봤다 인형 고"],

  "옷은 어때?": ["넌 퍼컬이 검정이야", "나시로 가자", "흰 티셔츠가 젤 나음"],
};

/* 응답 흐름 */
const replyMap = {
  // 시작
  "왜염": ["잠깐 얘기 좀 들어줄 수 있어?", "별 건 아니고", "그냥", "고민되는게 있는데"],
  "아무것도 안해": ["아 그래?", "그러면", "나랑 잠깐 얘기 좀 해줘"],

  "어어 말해봐": ["사실은", "내일 좋아하는 애한테", "고백하려고 하는데", "잠깐만 도와줘"],
  "싫어": ["ㅋㅋㅋㅋㅋㅋ아니", "아 내 말 좀 들어봐","내일 좋아하는 애한테", "고백하려고 하는데", "잠깐만 도와줘"],
  "음 그래": ["귀찮은 것 같은데 ㅋㅋㅋㅋ", "아니 그냥", "내일 좋아하는 애한테", "고백하려고 하는데", "잠깐만 도와줘"],

  "응응 나만 믿어!": ["ㅋㅋㅋ고마워", "아 일단", "imageSet20"],

  "놀이공원 꽤괜": ["오키오키", "옷은 어때?", "imageSet30"],
  "아직 더우니까 아이스크림": ["알았엉", "옷은 어때?", "imageSet30"],
  "인형 싫어하는 애 못봤다 인형 고": ["ㅋㅋㅋ그런가??", "옷은 어때?", "imageSet30"],

  "넌 퍼컬이 검정이야": ["그치","아 근데 뭐라고 말하지","너무 떨리는데", "추천 좀 해주라"],
  "나시로 가자": ["오케", "아 근데 뭐라고 말하지","너무 떨리는데", "추천 좀 해주라"],
  "흰 티셔츠가 젤 나음": ["마지못해 고르는 느낌이다 어째", "아 근데 뭐라고 말하지","너무 떨리는데", "추천 좀 해주라"],
};

const SionChat = ({ onBack, userName }) => {
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
  }, []);

  // ✅ 시온 메시지 저장 함수 (없어서 에러났던 부분)
  const saveSionMessage = async (msg) => {
    await axios.post(
      "http://localhost:4000/messages/respond",
      {
        name: "시온",
        response: msg.text || "",
        image: msg.image || "",
        fromNpc: true,
      },
      { withCredentials: true }
    );
  };

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:4000/messages", { withCredentials: true });
    const sion = res.data.find((m) => m.name === "시온");
    const initial = sion?.messages || [];
    if (initial.length === 0) {
      const first = { sender: "시온", text: "뭐해?", time: getCurrentFormattedTime() };
      setMessages([first]);
      await saveSionMessage(first);
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
      { name: "시온", response: text },
      { withCredentials: true }
    );

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    const textReplies = replies.filter((r) => !r.startsWith("imageSet"));
    const imageSetKey = replies.find((r) => r.startsWith("imageSet"));

    // 텍스트
    textReplies.forEach((replyText, idx) => {
      setTimeout(async () => {
        const reply = { sender: "시온", text: replyText, time: getCurrentFormattedTime() };
        setMessages((prev) => [...prev, reply]);
        await saveSionMessage(reply);
        if (idx === textReplies.length - 1 && !imageSetKey) setIsLoading(false);
      }, 1000 + idx * 1500);
    });

    if (imageSetKey === "imageSet20") {
      const imagePaths = [
        "/images/시온_놀이공원.jpg",
        "/images/시온_아이스.jpg",
        "/images/시온_인형가게.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "시온", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveSionMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp1 = { sender: "시온", text: "놀이공원, 아이스크림 가게, 인형가게 중에서", time: getCurrentFormattedTime() };
              const followUp2 = { sender: "시온", text: "어디가 좋을 것 같아??", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp1, followUp2]);
              await saveSionMessage(followUp1);
              await saveSionMessage(followUp2);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    } else if (imageSetKey === "imageSet30") {
      const imagePaths = [
        "/images/시온_옷/시온_검정티.jpg",
        "/images/시온_옷/시온_나시.jpg",
        "/images/시온_옷/시온_흰티.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "시온", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveSionMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp = { sender: "시온", text: "옷은 어때?", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp]);
              await saveSionMessage(followUp);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }
  };

  const lastMsg = messages[messages.length - 1];
  const isConfessionStep =
    lastMsg?.sender !== "me" && lastMsg?.text === "추천 좀 해주라";

  const handleConfessionSubmit = async () => {
    const text = confessionInput.trim();
    if (!text) return;

    const now = getCurrentFormattedTime();
    const myMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, myMsg]);
    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "시온", response: text },
      { withCredentials: true }
    );

    setConfessionInput("");
    setIsLoading(true);

    const clean = text.replace(/^["'“”]|["'“”]$/g, "");

    const msg1 = { sender: "시온", text: "ㅋㅋㅋㅋㅋ알았어", time: getCurrentFormattedTime() };
    const msg2 = (displayName || "").trim()
      ? { sender: "시온", text: `${(displayName || "").trim()}`, time: getCurrentFormattedTime() }
      : null;
    const msg3 = { sender: "시온", text: clean, time: getCurrentFormattedTime() };

    const t1 = 800;
    const t2 = msg2 ? 1600 : null;
    const t3 = msg2 ? 2400 : 1600;

    setTimeout(async () => {
      setMessages((p) => [...p, msg1]);
      await saveSionMessage(msg1);
    }, t1);

    if (msg2) {
      setTimeout(async () => {
        setMessages((p) => [...p, msg2]);
        await saveSionMessage(msg2);
      }, t2);
    }

    setTimeout(async () => {
      setMessages((p) => [...p, msg3]);
      await saveSionMessage(msg3);

      if (selectedPlace && selectedOutfit !== null) {
        const msg4 = {
          sender: "시온",
          text: `내일 ${outfitLabel(selectedOutfit)} 입고 ${placeLabel(selectedPlace)}에서 기다리고 있을게. 나 만나줘`,
          time: getCurrentFormattedTime(),
        };
        setTimeout(async () => {
          setMessages((p) => [...p, msg4]);
          await saveSionMessage(msg4);
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
    if (messages.length === 1 && last.text?.trim() === "뭐해?") {
      return ["왜염", "아무것도 안해"];
    }
    return choiceMap[last.text] || [];
  };

  const handleChoice = (text) => {
    // 장소
    if (text === "놀이공원 꽤괜") setSelectedPlace("놀이공원");
    if (text === "아직 더우니까 아이스크림") setSelectedPlace("아이스크림 가게");
    if (text === "인형 싫어하는 애 못봤다 인형 고") setSelectedPlace("인형가게");

    // 옷
    if (text === "넌 퍼컬이 검정이야") setSelectedOutfit("검정 티셔츠");
    if (text === "나시로 가자") setSelectedOutfit("나시");
    if (text === "흰 티셔츠가 젤 나음") setSelectedOutfit("흰 티셔츠");

    handleResponse(text);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">시온</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(true)} />
      </div>

      {/* 채팅 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}>
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img
                  src="/images/시온.jpg"
                  alt="시온"
                  className="w-12 h-12 rounded-full mr-2"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "/images/시온.png";
                  }}
                />
                <div>
                  <div className="text-sm font-semibold mb-1">시온</div>
                  <div className="flex items-end">
                    {msg.image ? (
                      <img src={msg.image} alt="시온 이미지" className="max-w-[200px] rounded-xl" />
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
              src="/images/시온.jpg"
              alt="시온"
              className="w-12 h-12 rounded-full mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/시온.png";
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
            {messages.filter((m) => m.image).map((msg, idx) => (
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

export default SionChat;
