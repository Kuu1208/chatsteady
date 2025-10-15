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
  if (o === "니트") return "니트";
  if (o === "스투시") return "스투시";
  if (o === "캡 모자") return "캡 모자";
  return o || "";
};
const placeLabel = (p) => p || "";

const choiceMap = {
  "그나저나 나 고민이 있는데": ["뭔데?", "일단 말해봐", "진지한 고민이야?"],
  "시간 있으면 나 고민 들어줘": ["뭔데?", "뭐가 고민인데", "왤케 진지"],
  "사실은 고민이 있어서 ..": ["뭔데?", "일단 말해봐", "내가 들어줄게"],
  "내가 요즘 좋아하는 사람이 있는데 ": ["엥 진짜?", "어어 그래서", "빨리 말해봐"],

  "나 좀 도와줘 ㅜㅜ": ["응응 나만 믿어!"],
  "나 잠깐 도와줄 수 있어?": ["응응 나만 믿어!"],
  "나 좀 도와주라": ["응응 나만 믿어!"],

  "어디로 불러내야 좋을까": ["무조건 수족관이죠", "회전초밥 나쁘지 않을 듯", "그래도 카페가 젤 무난하다"],

  "옷은 뭐 입고 갈까?": ["니트 귀엽다", "간지나게 스투시", "새로운 시도로 캡 모자"],
};

const replyMap = {
  "왜?": ["아니 그냥 물어봤어", "그나저나 나 고민이 있는데"],
  "아니 아직": ["시간 있으면 나 고민 들어줘"],
  "사주게?": ["ㅋㅋㅋㅋ아니", "사실은 고민이 있어서 .."],

  "뭔데?": ["내가 요즘 좋아하는 사람이 있는데 "],
  "일단 말해봐": ["내가 요즘 좋아하는 사람이 있는데 "],
  "진지한 고민이야?": ["내가 요즘 좋아하는 사람이 있는데 "],
  "뭐가 고민인데": ["내가 요즘 좋아하는 사람이 있는데 "],
  "왤케 진지": ["내가 요즘 좋아하는 사람이 있는데 "],
  "내가 들어줄게": ["내가 요즘 좋아하는 사람이 있는데 "],

  "엥 진짜?": ["왜 안믿징", "아무튼", "내일 고백할까 하는데", "나 좀 도와줘 ㅜㅜ"],
  "어어 그래서": ["아", "내일 고백할까 하는데", "나 잠깐 도와줄 수 있어?"],
  "빨리 말해봐": ["기다려봐ㅋㅋㅋㅋ", "내일 고백할까 하는데", "나 좀 도와주라"],

  "응응 나만 믿어!": ["고마워", "imageSet10"],

  "무조건 수족관이죠": ["ㅇㅋㅇㅋ", "imageSet20"],
  "회전초밥 나쁘지 않을 듯": ["그래?ㅋㅋㅋ", "imageSet20"],
  "그래도 카페가 젤 무난하다": ["그러니까", "imageSet20"],

  "니트 귀엽다": ["새로 샀어 ㅎㅎ", "도와줘서 고마워 ~😚", "고백 멘트도 추천해줄 수 있어?"],
  "간지나게 스투시": ["이런거 좋아하는구나", "도와줘서 고마워 ~😚", "고백 멘트도 추천해줄 수 있어?"],
  "새로운 시도로 캡 모자": ["그래? 알았어ㅎㅎ", "도와줘서 고마워 ~😚", "고백 멘트도 추천해줄 수 있어?"],
};

const YushiChat = ({ onBack, userName }) => {
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

  const fetchMessages = async () => {
    const res = await axios.get("http://localhost:4000/messages", { withCredentials: true });
    const yushi = res.data.find((m) => m.name === "유우시");
    const initial = yushi?.messages || [];
    if (initial.length === 0) {
      const first = { sender: "유우시", text: "밥 먹었어?", time: getCurrentFormattedTime() };
      setMessages([first]);
      await saveYushiMessage(first);
    } else {
      setMessages(initial);
    }
  };

  const saveYushiMessage = async (msg) => {
    await axios.post(
      "http://localhost:4000/messages/respond",
      {
        name: "유우시",
        response: msg.text || "",
        image: msg.image || "",
        fromNpc: true, // 서버가 NPC로 처리(fromNpc/fromSakuya/fromYushi 중 아무거나 true 면 OK)
      },
      { withCredentials: true }
    );
  };

  const handleResponse = async (text) => {
    const now = getCurrentFormattedTime();
    const newMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, newMsg]);

    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "유우시", response: text },
      { withCredentials: true }
    );

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    const textReplies = replies.filter((r) => !r.startsWith("imageSet"));
    const imageSetKey = replies.find((r) => r.startsWith("imageSet"));

    // 텍스트
    textReplies.forEach((replyText, idx) => {
      setTimeout(async () => {
        const reply = { sender: "유우시", text: replyText, time: getCurrentFormattedTime() };
        setMessages((prev) => [...prev, reply]);
        await saveYushiMessage(reply);
        if (idx === textReplies.length - 1 && !imageSetKey) setIsLoading(false);
      }, 1000 + idx * 1500);
    });

    // 장소 이미지
    if (imageSetKey === "imageSet10") {
      const imagePaths = ["/images/유우시_수족관.jpg", "/images/유우시_초밥.jpg", "/images/유우시_카페.jpg"];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "유우시", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveYushiMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp1 = { sender: "유우시", text: "수족관이랑 초밥집이랑 카페 중에", time: getCurrentFormattedTime() };
              const followUp2 = { sender: "유우시", text: "어디로 불러내야 좋을까", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp1, followUp2]);
              await saveYushiMessage(followUp1);
              await saveYushiMessage(followUp2);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }
    // 옷 이미지
    else if (imageSetKey === "imageSet20") {
      const imagePaths = [
        "/images/유우시_옷/유우시_니트.jpg",
        "/images/유우시_옷/유우시_스투시.jpg",
        "/images/유우시_옷/유우시_캡.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "유우시", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveYushiMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp = { sender: "유우시", text: "옷은 뭐 입고 갈까?", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp]);
              await saveYushiMessage(followUp);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }
  };

  const lastMsg = messages[messages.length - 1];
  const isConfessionStep =
    lastMsg?.sender !== "me" && lastMsg?.text === "고백 멘트도 추천해줄 수 있어?";

  const handleConfessionSubmit = async () => {
    const text = confessionInput.trim();
    if (!text) return;

    const now = getCurrentFormattedTime();
    const myMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, myMsg]);
    await axios.post(
      "http://localhost:4000/messages/respond",
      { name: "유우시", response: text },
      { withCredentials: true }
    );

    setConfessionInput("");
    setIsLoading(true);

    const clean = text.replace(/^["'“”]|["'“”]$/g, "");

    const msg1 = { sender: "유우시", text: "알았어", time: getCurrentFormattedTime() };
    const msg2 = (userName || "").trim()
      ? { sender: "유우시", text: `${(userName || "").trim()}`, time: getCurrentFormattedTime() }
      : null;
    const msg3 = { sender: "유우시", text: clean, time: getCurrentFormattedTime() };

    const t1 = 800;
    const t2 = msg2 ? 1600 : null;
    const t3 = msg2 ? 2400 : 1600;

    setTimeout(async () => {
      setMessages((p) => [...p, msg1]);
      await saveYushiMessage(msg1);
    }, t1);

    if (msg2) {
      setTimeout(async () => {
        setMessages((p) => [...p, msg2]);
        await saveYushiMessage(msg2);
      }, t2);
    }

    setTimeout(async () => {
      setMessages((p) => [...p, msg3]);
      await saveYushiMessage(msg3);

      if (selectedPlace && selectedOutfit) {
        const msg4 = {
          sender: "유우시",
          text: `내일 ${outfitLabel(selectedOutfit)} 차림으로 ${placeLabel(selectedPlace)}에서 기다릴게`,
          time: getCurrentFormattedTime(),
        };
        setTimeout(async () => {
          setMessages((p) => [...p, msg4]);
          await saveYushiMessage(msg4);
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
    if (messages.length === 1 && last.text?.trim() === "밥 먹었어?") {
      return ["왜?", "아니 아직", "사주게?"];
    }
    return choiceMap[last.text] || [];
  };

  const handleChoice = (text) => {
    if (text === "무조건 수족관이죠") setSelectedPlace("수족관");
    if (text === "회전초밥 나쁘지 않을 듯") setSelectedPlace("초밥집");
    if (text === "그래도 카페가 젤 무난하다") setSelectedPlace("카페");

    if (text === "니트 귀엽다") setSelectedOutfit("니트");
    if (text === "간지나게 스투시") setSelectedOutfit("스투시");
    if (text === "새로운 시도로 캡 모자") setSelectedOutfit("캡 모자");

    handleResponse(text);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">유우시</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(true)} />
      </div>

      {/* 채팅 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}>
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img
                  src="/images/유우시.jpg"
                  alt="유우시"
                  className="w-12 h-12 rounded-full mr-2"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "/images/유우시.png";
                  }}
                />
                <div>
                  <div className="text-sm font-semibold mb-1">유우시</div>
                  <div className="flex items-end">
                    {msg.image ? (
                      <img src={msg.image} alt="유우시 이미지" className="max-w-[200px] rounded-xl" />
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
              src="/images/유우시.jpg"
              alt="유우시"
              className="w-12 h-12 rounded-full mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/유우시.png";
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

export default YushiChat;
