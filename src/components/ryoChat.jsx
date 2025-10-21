import React, { useEffect, useMemo, useState } from "react";
import { ReactComponent as BackIcon } from "../icons/iconmonstr-arrow-64.svg";
import { ReactComponent as GalleryIcon } from "../icons/iconmonstr-picture-5.svg";
import { api } from "../api";

const getCurrentFormattedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

const outfitLabel = (o) => {
  if (o === "니트") return "니트";
  if (o === "비니") return "비니";
  if (o === "카라 티") return "카라 티";
  return o || "";
};
const placeLabel = (p) => p || "";

/* 선택지 */
const choiceMap = {
  "시간 내줄 수 있어?": ["당연하지"],
  "그냥 고민이 있는데": ["뭔데?"],

  "조금만 도와줄 수 있어?": ["응응 나만 믿어!"],

  "어디서 만나야 자연스러워??": [
    "디저트 가게가 이쁘고 괜춘",
    "시원하게 빙수 ㄱㄱ",
    "아직 학생이니까 스카",
  ],

  "셋 중에 머가 괜찮아??": ["니트가 이쁘다", "비니 잘어울림", "마지막 고고고"],
};

/* 응답 흐름 */
const replyMap = {
  // 시작
  "딱히...": ["심심하면", "10분만", "시간 내줄 수 있어?"],
  "갑자기 뭐야": ["아니", "별건 아니고", "그냥 고민이 있는데"],

  "당연하지": ["뭐냐면", "ㅋㅋㅋㅋㅋ", "아 내일 좋아하는 애한테", "고백하려고 하는데", "조금만 도와줄 수 있어?"],
  "뭔데?": ["아니 그냥", "내일 좋아하는 애한테", "고백하고 싶어서 그런데", "조금만 도와줄 수 있어?"],

  "응응 나만 믿어!": ["고마워어😇", "음 먼저", "imageSet50"],

  "디저트 가게가 이쁘고 괜춘": ["알았어ㅎㅎ", "옷이나 이런거는 어때??", "imageSet40"],
  "시원하게 빙수 ㄱㄱ": ["글쿠만", "옷이나 이런거는 어때??", "imageSet40"],
  "아직 학생이니까 스카": ["ㅠㅠ괜찮겠지?", "옷이나 이런거는 어때??", "imageSet40"],

  "니트가 이쁘다": ["그래??", "아 근데 뭐라고 말하지", "너무 떨리는데", "뭐라고 말하는게 나아?"],
  "비니 잘어울림": ["알았엉", "아 근데 뭐라고 말하지", "너무 떨리는데", "뭐라고 말하는게 나아?"],
  "마지막 고고고": ["오키오키", "아 근데 뭐라고 말하지", "너무 떨리는데", "뭐라고 말하는게 나아?"],
};

const RyoChat = ({ onBack, userName }) => {
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

  const saveRyoMessage = async (msg) => {
    try {
      await api.post("/messages/respond", {
        name: "료",
        response: msg.text || "",
        image: msg.image || "",
        fromNpc: true,
      });
    } catch (e) {
      console.error("saveRyoMessage 실패:", e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages");
      const ryo = res.data.find((m) => m.name === "료");
      const initial = ryo?.messages || [];
      if (initial.length === 0) {
        const first = { sender: "료", text: "뭐함?", time: getCurrentFormattedTime() };
        setMessages([first]);
        await saveRyoMessage(first);
      } else {
        setMessages(initial);
      }
    } catch (e) {
      console.error("메시지 불러오기 실패:", e);
    }
  };

  const handleResponse = async (text) => {
    const now = getCurrentFormattedTime();
    const newMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await api.post("/messages/respond", { name: "료", response: text });
    } catch (e) {
      console.error("응답 저장 실패:", e);
    }

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    const textReplies = replies.filter(
      (r) => !(r || "").toString().trim().toLowerCase().startsWith("imageset")
    );
    const imageSetKey =
      (replies.find((r) => (r || "").toString().trim().toLowerCase().startsWith("imageset")) || "").trim();

    // 텍스트
    if (textReplies.length > 0) {
      textReplies.forEach((replyText, idx) => {
        setTimeout(async () => {
          const reply = { sender: "료", text: replyText, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveRyoMessage(reply);
          if (idx === textReplies.length - 1 && !imageSetKey) setIsLoading(false);
        }, 1000 + idx * 1500);
      });
    }

    // 장소 이미지 세트
    if (imageSetKey === "imageset50" || imageSetKey === "imageSet50") {
      const imagePaths = ["/images/료_디저트.jpg", "/images/료_빙수.jpg", "/images/료_스카.jpg"];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "료", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveRyoMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp1 = { sender: "료", text: "디저트 가게랑 빙수집이랑 스카 중에", time: getCurrentFormattedTime() };
              const followUp2 = { sender: "료", text: "어디서 만나야 자연스러워??", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp1, followUp2]);
              await saveRyoMessage(followUp1);
              await saveRyoMessage(followUp2);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }
    // 옷 이미지 세트
    else if (imageSetKey === "imageset40" || imageSetKey === "imageSet40") {
      const imagePaths = [
        "/images/료_옷/료_니트.jpg",
        "/images/료_옷/료_비니.jpg",
        "/images/료_옷/료_파랑.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "료", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveRyoMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp = { sender: "료", text: "셋 중에 머가 괜찮아??", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp]);
              await saveRyoMessage(followUp);
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
  const isConfessionStep = lastMsg?.sender !== "me" && lastMsg?.text === "뭐라고 말하는게 나아?";

  const handleConfessionSubmit = async () => {
    const text = confessionInput.trim();
    if (!text) return;

    const now = getCurrentFormattedTime();
    const myMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, myMsg]);

    try {
      await api.post("/messages/respond", { name: "료", response: text });
    } catch (e) {
      console.error("고백 멘트 저장 실패:", e);
    }

    setConfessionInput("");
    setIsLoading(true);

    const clean = text.replace(/^["'“”]|["'“”]$/g, "");

    const safeName = (displayName || "").trim();
    const msg1 = { sender: "료", text: "골라줘서 고맙당", time: getCurrentFormattedTime() };
    const msg2 = safeName ? { sender: "료", text: safeName, time: getCurrentFormattedTime() } : null;
    const msg3 = { sender: "료", text: clean, time: getCurrentFormattedTime() };

    const t1 = 800;
    const t2 = msg2 ? 1600 : null;
    const t3 = msg2 ? 2400 : 1600;

    setTimeout(async () => {
      setMessages((p) => [...p, msg1]);
      await saveRyoMessage(msg1);
    }, t1);

    if (msg2) {
      setTimeout(async () => {
        setMessages((p) => [...p, msg2]);
        await saveRyoMessage(msg2);
      }, t2);
    }

    setTimeout(async () => {
      setMessages((p) => [...p, msg3]);
      await saveRyoMessage(msg3);

      if (selectedPlace && typeof selectedOutfit === "string") {
        const msg4 = {
          sender: "료",
          text: `내일 ${outfitLabel(selectedOutfit)} 차림으로 ${placeLabel(selectedPlace)}에서 기다릴게.`,
          time: getCurrentFormattedTime(),
        };
        setTimeout(async () => {
          setMessages((p) => [...p, msg4]);
          await saveRyoMessage(msg4);
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
    if (messages.length === 1 && (last.text || "").trim() === "뭐함?") {
      return ["딱히...", "갑자기 뭐야"];
    }
    return choiceMap[last.text] || [];
  };

  const handleChoice = (text) => {
    // 장소
    if (text === "디저트 가게가 이쁘고 괜춘") setSelectedPlace("디저트 가게");
    if (text === "시원하게 빙수 ㄱㄱ") setSelectedPlace("빙수집");
    if (text === "아직 학생이니까 스카") setSelectedPlace("스카");

    // 옷
    if (text === "니트가 이쁘다") setSelectedOutfit("니트");
    if (text === "비니 잘어울림") setSelectedOutfit("비니");
    if (text === "마지막 고고고") setSelectedOutfit("카라 티");

    handleResponse(text);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">료</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(true)} />
      </div>

      {/* 채팅 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}>
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img
                  src="/images/료.jpg"
                  alt="료"
                  className="w-12 h-12 rounded-full mr-2"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "/images/료.png";
                  }}
                />
                <div>
                  <div className="text-sm font-semibold mb-1">료</div>
                  <div className="flex items-end">
                    {msg.image ? (
                      <img src={msg.image} alt="료 이미지" className="max-w-[200px] rounded-xl" />
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
              src="/images/료.jpg"
              alt="료"
              className="w-12 h-12 rounded-full mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/료.png";
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

export default RyoChat;
