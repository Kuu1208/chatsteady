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
  if (o === "뿔테") return "뿔테 안경";
  if (o === "테 안경") return "테 안경";
  if (o === "평상시") return "평상시";
  return o || "";
};
const placeLabel = (p) => p || "";

/* 선택지 */
const choiceMap = {
  "고민되는게 있는데": ["응응 말해"],
  "그냥 물어볼게": ["뭔데뭔데"],
  "고민상담 들어줘": ["뭔데?", "상담비 줘라"],

  "좋은 아이디어 있어?": ["음.. 글쎄", "어떻게 하려고"],

  "조금만 도와줄 수 있어?": ["응응 나만 믿어!"],

  "어디로 불러내지?": ["놀이공원 !!!!!!!!", "너 일본인이니까 라멘맛집 ㄱㄱ", "카페가 젤 낫다"],

  "안경도 골라줭~~": ["닥 뿔테", "2222", "엥 걍 맨 얼굴이 젤 나음"],
};

/* 응답 흐름 */
const replyMap = {
  // 시작
  "아무것도 안해": ["지금 시간 있어?", "고민되는게 있는데"],
  "그냥 핸드폰 하는 중": ["전화 할래?", "아 아니다", "그냥 물어볼게"],
  "왜?": ["지금 시간 괜찮아?", "고민상담 들어줘"],

  "응응 말해": ["내일 어떤 애한테 고백하려고 하는데", "좋은 아이디어 있어?"],
  "뭔데뭔데": ["내일 어떤 애한테 고백하려고 하는데", "좋은 아이디어 있어?"],
  "뭔데?": ["내일 어떤 애한테 고백하려고 하는데", "좋은 아이디어 있어?"],
  "상담비 줘라": ["내일 어떤 애한테 고백하려고 하는데", "좋은 아이디어 있어?"],

  "음.. 글쎄": ["일단은", "내일 고백할까 하는데", "조금만 도와줄 수 있어?"],
  "어떻게 하려고": ["일단", "내일 고백할까 하는데", "조금만 도와줄 수 있어?"],

  "응응 나만 믿어!": ["고마워ㅜㅜㅜㅜ", "일단 여기서 고백할 장소 골라줘", "imageSet20"],

  "놀이공원 !!!!!!!!": ["그치??", "안경도 골라줭~~", "imageSet30"],
  "너 일본인이니까 라멘맛집 ㄱㄱ": ["ㅋㅋㅋㅋㅋ그런가??", "안경도 골라줭~~", "imageSet30"],
  "카페가 젤 낫다": ["알았엉", "안경도 골라줭~~", "imageSet30"],

  "닥 뿔테": ["그치", "예쁘지", "아 근데 너무 떨려ㅓㅓㅓㅓㅓ", "근데 뭐라고 말하면서 고백하지?"],
  "2222": ["오킹", "아 근데 너무 떨려ㅓㅓㅓㅓㅓ", "근데 뭐라고 말하면서 고백하지?"],
  "엥 걍 맨 얼굴이 젤 나음": ["ㅠㅠ 알았어..", "아 근데 넘 떨리는데ㅔㅔ", "근데 뭐라고 말하면서 고백하지?"],
};

const RikuChat = ({ onBack, userName }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [confessionInput, setConfessionInput] = useState("");

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

  const saveRikuMessage = async (msg) => {
    try {
      await api.post("/messages/respond", {
        name: "리쿠",
        response: msg.text || "",
        image: msg.image || "",
        fromNpc: true,
      });
    } catch (e) {
      console.error("saveRikuMessage 실패:", e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/messages");
      const riku = res.data.find((m) => m.name === "리쿠");
      const initial = riku?.messages || [];
      if (initial.length === 0) {
        const first = { sender: "리쿠", text: "지금 뭐해 ~", time: getCurrentFormattedTime() };
        setMessages([first]);
        await saveRikuMessage(first);
      } else {
        setMessages(initial);
        // 🔥 추가: 이미 고백 멘트 완료되었는지 체크
        const hasConfession = initial.some(msg => 
          msg.text && msg.text.includes("내일") && msg.text.includes("기다리고 있을게")
        );
        if (hasConfession) {
          setConfessionSent(true);
        }
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
      await api.post("/messages/respond", { name: "리쿠", response: text });
    } catch (e) {
      console.error("응답 저장 실패:", e);
    }

    setTimeout(() => setIsLoading(true), 300);

    const replies = replyMap[text] || [];
    const textReplies = replies.filter(
      (r) => !(r || "").toString().trim().toLowerCase().startsWith("imageset")
    );
    const imageSetKey = (replies.find((r) =>
      (r || "").toString().trim().toLowerCase().startsWith("imageset")
    ) || "").trim();

    // 텍스트
    if (textReplies.length > 0) {
      textReplies.forEach((replyText, idx) => {
        setTimeout(async () => {
          const reply = { sender: "리쿠", text: replyText, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveRikuMessage(reply);
          if (idx === textReplies.length - 1 && !imageSetKey) setIsLoading(false);
        }, 1000 + idx * 1500);
      });
    }

    // 장소 이미지
    if (imageSetKey === "imageset20" || imageSetKey === "imageSet20") {
      const imagePaths = ["/images/리쿠_놀이동산.jpg", "/images/리쿠_라멘.jpg", "/images/리쿠_카페.jpg"];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "리쿠", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveRikuMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp1 = { sender: "리쿠", text: "놀이공원, 라멘집, 카페 중에서", time: getCurrentFormattedTime() };
              const followUp2 = { sender: "리쿠", text: "어디로 불러내지?", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp1, followUp2]);
              await saveRikuMessage(followUp1);
              await saveRikuMessage(followUp2);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    }
    // 옷 이미지
    else if (imageSetKey === "imageset30" || imageSetKey === "imageSet30") {
      const imagePaths = [
        "/images/리쿠_옷/리쿠_뿔테.jpg",
        "/images/리쿠_옷/리쿠_안경1.jpg",
        "/images/리쿠_옷/리쿠_안경X.jpg",
      ];
      imagePaths.forEach((path, idx) => {
        setTimeout(async () => {
          const reply = { sender: "리쿠", image: path, time: getCurrentFormattedTime() };
          setMessages((prev) => [...prev, reply]);
          await saveRikuMessage(reply);
          if (idx === imagePaths.length - 1) {
            setTimeout(async () => {
              const followUp = { sender: "리쿠", text: "안경도 골라줭~~", time: getCurrentFormattedTime() };
              setMessages((prev) => [...prev, followUp]);
              await saveRikuMessage(followUp);
              setIsLoading(false);
            }, 1500);
          }
        }, 1000 + textReplies.length * 1500 + idx * 1500);
      });
    } else if (textReplies.length === 0) {
      setIsLoading(false);
    }
  };

  const lastMsg = messages[messages.length - 1];
  const isConfessionStep =
    lastMsg?.sender !== "me" && lastMsg?.text === "근데 뭐라고 말하면서 고백하지?";

  const handleConfessionSubmit = async () => {
    // 🔥 추가: 이미 고백 멘트 보냈으면 중복 실행 방지
    if (confessionSent) {
      return;
    }

    const text = confessionInput.trim();
    if (!text) return;

    const now = getCurrentFormattedTime();
    const myMsg = { sender: "me", text, time: now };
    setMessages((prev) => [...prev, myMsg]);

    try {
      await api.post("/messages/respond", { name: "리쿠", response: text });
    } catch (e) {
      console.error("고백 멘트 저장 실패:", e);
    }

    setConfessionInput("");
    setIsLoading(true);
    setConfessionSent(true); // 🔥 추가: 완료 플래그 설정

    const clean = text.replace(/^["'""]|["'""]$/g, "");

    const msg1 = { sender: "리쿠", text: "아라쏘", time: getCurrentFormattedTime() };
    const msg2 = (userName || "").trim()
      ? { sender: "리쿠", text: `${(userName || "").trim()}`, time: getCurrentFormattedTime() }
      : null;
    const msg3 = { sender: "리쿠", text: clean, time: getCurrentFormattedTime() };

    const t1 = 800;
    const t2 = msg2 ? 1600 : null;
    const t3 = msg2 ? 2400 : 1600;

    setTimeout(async () => {
      setMessages((p) => [...p, msg1]);
      await saveRikuMessage(msg1);
    }, t1);

    if (msg2) {
      setTimeout(async () => {
        setMessages((p) => [...p, msg2]);
        await saveRikuMessage(msg2);
      }, t2);
    }

    setTimeout(async () => {
      setMessages((p) => [...p, msg3]);
      await saveRikuMessage(msg3);

      if (selectedPlace && selectedOutfit !== null) {
        const msg4 = {
          sender: "리쿠",
          text: `내일 ${outfitLabel(selectedOutfit)} 차림으로 ${placeLabel(selectedPlace)}에서 기다리고 있을게`,
          time: getCurrentFormattedTime(),
        };
        setTimeout(async () => {
          setMessages((p) => [...p, msg4]);
          await saveRikuMessage(msg4);
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
    if (messages.length === 1 && (last.text || "").trim() === "지금 뭐해 ~") {
      return ["아무것도 안해", "그냥 핸드폰 하는 중", "왜?"];
    }
    return choiceMap[last.text] || [];
  };

  const handleChoice = (text) => {
    // 장소
    if (text === "놀이공원 !!!!!!!!") setSelectedPlace("놀이공원");
    if (text === "너 일본인이니까 라멘맛집 ㄱㄱ") setSelectedPlace("라멘집");
    if (text === "카페가 젤 낫다") setSelectedPlace("카페");

    // 안경/룩
    if (text === "닥 뿔테") setSelectedOutfit("뿔테");
    if (text === "2222") setSelectedOutfit("테 안경");
    if (text === "엥 걍 맨 얼굴이 젤 나음") setSelectedOutfit("평상시");

    handleResponse(text);
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white border-x relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <BackIcon className="w-5 h-5 cursor-pointer" onClick={onBack} />
        <div className="font-semibold text-base">리쿠</div>
        <GalleryIcon className="w-5 h-5 cursor-pointer" onClick={() => setIsGalleryOpen(true)} />
      </div>

      {/* 채팅 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "me" ? "justify-end" : "items-start"}`}>
            {msg.sender !== "me" ? (
              <div className="flex items-start">
                <img
                  src="/images/리쿠.jpg"
                  alt="리쿠"
                  className="w-12 h-12 rounded-full mr-2"
                  onError={(e) => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = "/images/리쿠.png";
                  }}
                />
                <div>
                  <div className="text-sm font-semibold mb-1">리쿠</div>
                  <div className="flex items-end">
                    {msg.image ? (
                      <img src={msg.image} alt="리쿠 이미지" className="max-w-[200px] rounded-xl" />
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
              src="/images/리쿠.jpg"
              alt="리쿠"
              className="w-12 h-12 rounded-full mr-2"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/리쿠.png";
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

export default RikuChat;