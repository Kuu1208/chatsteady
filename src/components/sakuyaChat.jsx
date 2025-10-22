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

// 한국어 라벨 정리
const outfitLabel = (o) => {
  if (o === "노랑") return "노랑색 옷";
  if (o === "셔츠") return "셔츠";
  if (o === "줄무늬") return "줄무늬 옷";
  return o || "";
};
const placeLabel = (p) => p || "";

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
  "나 좀 도와줄 수 있어?": ["응응 나만 믿어!"],

  "어디로 불러내야 좋을까": ["빵 가게가 좋을 듯?", "솜사탕 가게가 귀여움", "카페가 젤 무난하지"],

  "옷은 뭐 입고 갈까?": ["귀엽게 노랑색 옷?", "셔츠가 나을 듯", "줄무늬가 제일 나아"],
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
  "그래서 고민이 뭔데 ?": ["내일 고백하려고 하는데 .."],

  "내가 다 떨리네": ["나 좀 도와줄 수 있어?"],
  "잘 될거야 ㅋㅋ": ["나 좀 도와줄 수 있어?"],
  "떨지마 !!!": ["웅ㅋㅋ", "나 좀 도와줄 수 있어?"],

  "헐헐?": ["너가 나 좀 도와줘"],
  "어떻게 하려고": ["너가 나 좀 도와줘"],
  "내가 도와줘야 해?": ["너가 나 좀 도와줘"],

  "응응 나만 믿어!": ["imageSet"],

  "빵 가게가 좋을 듯?": ["그런가?", "옷은 뭐 입고 갈까?", "imageSet1"],
  "솜사탕 가게가 귀여움": ["역시 솜사탕이지", "옷은 뭐 입고 갈까?", "imageSet1"],
  "카페가 젤 무난하지": ["그치? 나도 그렇게 생각했어", "옷은 뭐 입고 갈까?", "imageSet1"],

  "귀엽게 노랑색 옷?": ["그치? 나도 그렇게 생각했어", "고백 멘트는 뭐라고 하는게 좋지"],
  "셔츠가 나을 듯": ["그래? 알았어", "고백 멘트는 뭐라고 하는게 좋지"],
  "줄무늬가 제일 나아": ["오키", "고백 멘트는 뭐라고 하는게 좋지"],
};

const SakuyaChat = ({ onBack, userName }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confessionInput, setConfessionInput] = useState("");

  // 선택 추적
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  
  // 🔥 추가: 고백 멘트 완료 여부 체크
  const [confessionSent, setConfessionSent] = useState(false);

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

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages");
      const sakuya = res.data.find((m) => m.name === "사쿠야");
      const initial = sakuya?.messages || [];
      if (initial.length === 0) {
        const first = { sender: "사쿠야", text: "뭐해?", time: getCurrentFormattedTime() };
        setMessages([first]);
        await saveSakuyaMessage(first);
      } else {
        setMessages(initial);
        // 🔥 추가: 이미 고백 멘트 완료되었는지 체크
        const hasConfession = initial.some(msg => 
          msg.text && msg.text.includes("내일") && msg.text.includes("기다릴게")
        );
        if (hasConfession) {
          setConfessionSent(true);
        }
      }
    } catch (e) {
      console.error("메시지 불러오기 실패:", e);
      setMessages([]);
    }
  };

  const saveSakuyaMessage = async (msg) => {
    try {
      await api.post("/messages/respond", {
        name: "사쿠야",
        response: msg.text || "",
        image: msg.image || "",
        fromSakuya: true,
      });
    } catch (e) {
      console.error("saveSakuyaMessage 실패:", e);
    }
  };

  const handleResponse = async (text) => {
    const now = getCurrentFormattedTime();
    const newMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await api.post("/messages/respond", { name: "사쿠야", response: text });
    } catch (e) {
      console.error("사용자 응답 저장 실패:", e);
    }

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    const textReplies = replies.filter(
      (r) => !(r || "").toString().trim().toLowerCase().startsWith("imageset")
    );
    const imageSetKey =
      (replies.find((r) => (r || "").toString().trim().toLowerCase().startsWith("imageset")) || "").trim();

    // 텍스트 응답
    textReplies.forEach((replyText, idx) => {
      setTimeout(async () => {
        const reply = { sender: "사쿠야", text: replyText, time: getCurrentFormattedTime() };
        setMessages((prev) => [...prev, reply]);
        await saveSakuyaMessage(reply);
        if (idx === textReplies.length - 1 && !imageSetKey) setIsLoading(false);
      }, 1000 + idx * 1500);
    });

    // 장소 후보 이미지
    if (imageSetKey === "imageset" || imageSetKey === "imageSet") {
      const imagePaths = ["/images/사쿠야_빵.jpg", "/images/사쿠야_솜사탕.jpg", "/images/사쿠야_커피.jpg"];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "사쿠야", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveSakuyaMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp1 = { sender: "사쿠야", text: "빵 가게랑 솜사탕 가게랑 카페 중에", time: getCurrentFormattedTime() };
              const followUp2 = { sender: "사쿠야", text: "어디로 불러내야 좋을까", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp1, followUp2]);
              await saveSakuyaMessage(followUp1);
              await saveSakuyaMessage(followUp2);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }

    // 옷 후보 이미지
    if (imageSetKey === "imageset1" || imageSetKey === "imageSet1") {
      const imagePaths = [
        "/images/사쿠_옷/사쿠야_노랑.jpg",
        "/images/사쿠_옷/사쿠야_셔츠.jpg",
        "/images/사쿠_옷/사쿠야_줄무늬.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "사쿠야", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveSakuyaMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp = { sender: "사쿠야", text: "옷은 뭐 입고 갈까?", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp]);
              await saveSakuyaMessage(followUp);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    } else if (textReplies.length === 0) {
      setIsLoading(false);
    }
  };

  // 마지막 메시지 & 고백 단계 여부
  const lastMsg = messages[messages.length - 1];
  const isConfessionStep =
    lastMsg?.sender === "사쿠야" && lastMsg?.text === "고백 멘트는 뭐라고 하는게 좋지";

  const handleConfessionSubmit = async () => {
    // 🔥 추가: 이미 고백 멘트 보냈으면 중복 실행 방지
    if (confessionSent) {
      return;
    }

    const text = (confessionInput || "").trim();
    if (!text) return;

    const now = getCurrentFormattedTime();
    const myMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, myMsg]);

    try {
      await api.post("/messages/respond", { name: "사쿠야", response: text });
    } catch (e) {
      console.error("고백 멘트 저장 실패:", e);
    }

    setConfessionInput("");
    setIsLoading(true);
    setConfessionSent(true); // 🔥 추가: 완료 플래그 설정

    const clean = text.replace(/^["'""]|["'""]$/g, "");

    const safeName = (displayName || "").trim();
    const msg1 = { sender: "사쿠야", text: "알았어", time: getCurrentFormattedTime() };
    const msg2 = safeName ? { sender: "사쿠야", text: safeName, time: getCurrentFormattedTime() } : null;
    const msg3 = { sender: "사쿠야", text: clean, time: getCurrentFormattedTime() };

    const t1 = 800;
    const t2 = msg2 ? 1600 : null;
    const t3 = msg2 ? 2400 : 1600;

    setTimeout(async () => {
      setMessages((p) => [...p, msg1]);
      await saveSakuyaMessage(msg1);
    }, t1);

    if (msg2) {
      setTimeout(async () => {
        setMessages((p) => [...p, msg2]);
        await saveSakuyaMessage(msg2);
      }, t2);
    }

    setTimeout(async () => {
      setMessages((p) => [...p, msg3]);
      await saveSakuyaMessage(msg3);

      if (selectedPlace && typeof selectedOutfit === "string") {
        const msg4 = {
          sender: "사쿠야",
          text: `내일 ${placeLabel(selectedPlace)}에서 ${outfitLabel(selectedOutfit)} 입고 기다릴게`,
          time: getCurrentFormattedTime(),
        };
        setTimeout(async () => {
          setMessages((p) => [...p, msg4]);
          await saveSakuyaMessage(msg4);
          setIsLoading(false);
        }, 1000);
      } else {
        setIsLoading(false);
      }
    }, t3);
  };

  const getChoices = () => {
    if (!lastMsg || lastMsg.sender !== "사쿠야") {
      // 대화 시작 직후(첫 메시지 없거나 다른 상태) 기본 선택지
      return messages.length <= 1 ? ["갑자기? ㅋㅋ", "뭔데?", "무슨 빵"] : [];
    }
    return choiceMap[lastMsg.text] || [];
  };

  const handleChoice = (text) => {
    // 장소 기록
    if (text === "카페가 젤 무난하지") setSelectedPlace("카페");
    if (text === "빵 가게가 좋을 듯?") setSelectedPlace("빵 가게");
    if (text === "솜사탕 가게가 귀여움") setSelectedPlace("솜사탕 가게");

    // 옷 기록
    if (text === "귀엽게 노랑색 옷?") setSelectedOutfit("노랑");
    if (text === "셔츠가 나을 듯") setSelectedOutfit("셔츠");
    if (text === "줄무늬가 제일 나아") setSelectedOutfit("줄무늬");

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
          <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}>
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img src="/images/사쿠야.jpg" alt="사쿠야" className="w-12 h-12 rounded-full mr-2" />
                <div>
                  <div className="text-sm font-semibold mb-1">사쿠야</div>
                  <div className="flex items-end">
                    {msg.image ? (
                      <img src={msg.image} alt="사쿠야 이미지" className="max-w-[200px] rounded-xl" />
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
            <img src="/images/사쿠야.jpg" alt="사쿠야" className="w-12 h-12 rounded-full mr-2" />
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
          {isConfessionStep && !confessionSent ? (
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
          ) : !confessionSent ? (
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
          ) : null}
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

export default SakuyaChat;