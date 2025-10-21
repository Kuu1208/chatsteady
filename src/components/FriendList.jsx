// src/components/FriendList.jsx
import React, { useEffect, useRef, useState } from "react";
import { ReactComponent as UserIcon } from "../icons/iconmonstr-user-6.svg";
import { ReactComponent as ChatIcon } from "../icons/iconmonstr-speech-bubble-3.svg";
import { ReactComponent as HeadphonesIcon } from "../icons/iconmonstr-headphones-2.svg";
import { ReactComponent as CloseIcon } from "../icons/iconmonstr-x-mark-lined.svg";
import axios from "axios";
import ChatRoom from "./ChatRoom";
import SakuyaChat from "./sakuyaChat";
import YushiChat from "./yushiChat";
import RikuChat from "./rikuChat";
import SionChat from "./sionChat";
import RyoChat from "./ryoChat";
import JaeheeChat from "./jaeheeChat";

const getCurrentFormattedTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

const friends = [
  { name: "시온", status: "🙏", image: "/images/시온.jpg" },
  { name: "리쿠", status: "21", image: "/images/리쿠.jpg", background: "/images/리쿠배경.jpg" },
  { name: "유우시", status: "😙", image: "/images/유우시.jpg" },
  { name: "재희", status: "ㅂㄱㅅㄷ", image: "/images/재희.jpg" },
  { name: "료", status: "❤❤❤❤❤❤❤", image: "/images/료.jpg" },
  { name: "사쿠야", status: "옆구리가 허전하네", image: "/images/사쿠야.jpg", background: "/images/사쿠배경.jpg" },
];

const FriendList = () => {
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [activeTab, setActiveTab] = useState("friends");
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [loginTime] = useState(getCurrentFormattedTime());

  const [sakuyaChatOpen, setSakuyaChatOpen] = useState(false);
  const [yushiChatOpen, setYushiChatOpen] = useState(false);
  const [rikuChatOpen, setRikuChatOpen] = useState(false);
  const [sionChatOpen, setSionChatOpen] = useState(false);
  const [ryoChatOpen, setRyoChatOpen] = useState(false);
  const [jaeheeChatOpen, setJaeheeChatOpen] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await axios.get("http://localhost:4000/me", { withCredentials: true });
        const { nickname, phoneNumber, imageUrl } = me?.data ?? {};
        setNickname(nickname || "");
        setPhone(phoneNumber || "");
        setProfileImage(imageUrl || null);
        if (nickname) localStorage.setItem("userName", nickname);
      } catch {
        setNickname("닉네임");
        setPhone("");
        setProfileImage(null);
      }

      try {
        const res = await axios.get("http://localhost:4000/messages", { withCredentials: true });
        const arr = Array.isArray(res.data) ? res.data : [];
        const withLoginTime = arr.map((m) => ({
          ...m,
          time: m.time || loginTime,
        }));
        setMessages(withLoginTime);
      } catch (e) {
        console.error("메시지 불러오기 실패", e);
      }
    })();
  }, [loginTime]);

  useEffect(() => {
    const total = messages.reduce((sum, m) => sum + (m.unreadCount || 0), 0);
    setUnreadTotal(total);
  }, [messages]);

  const handleNicknameSave = () => {
    const nk = nickname.trim();
    if (!nk) return;
    axios.post("http://localhost:4000/login", { nickname: nk }, { withCredentials: true });
    localStorage.setItem("userName", nk);
  };

  const handlePhoneSave = () => {
    if (!phone.trim()) return;
    axios.post("http://localhost:4000/profile/phone", { phone }, { withCredentials: true });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://localhost:4000/profile/image", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileImage(res.data.imageUrl);
    } catch (err) {
      console.error("사진 업로드 실패", err);
      alert("프로필 사진 업로드에 실패했습니다.");
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleChatClick = async (index) => {
    const selected = messages[index];
    if (!selected) return;

    try {
      await axios.post(
        "http://localhost:4000/messages/read",
        { name: selected.name },
        { withCredentials: true }
      );
    } catch (e) {
      console.error("서버에 읽음 처리 실패", e);
    }

    const updated = [...messages];
    updated[index].unreadCount = 0;
    updated[index].messages =
      updated[index].messages?.map((msg) => ({ ...msg, read: true })) || [];
    setMessages(updated);

    // 모든 플래그 초기화
    setActiveChat(null);
    setSakuyaChatOpen(false);
    setYushiChatOpen(false);
    setRikuChatOpen(false);
    setSionChatOpen(false);
    setRyoChatOpen(false);
    setJaeheeChatOpen(false);

    // 캐릭터별 전용 채팅 열기
    if (selected.name === "사쿠야") {
      setSakuyaChatOpen(true);
    } else if (selected.name === "유우시") {
      setYushiChatOpen(true);
    } else if (selected.name === "리쿠") {
      setRikuChatOpen(true);
    } else if (selected.name === "시온") {
      setSionChatOpen(true);
    } else if (selected.name === "료") {
      setRyoChatOpen(true); 
    }
      else if (selected.name === "재희") {
      setJaeheeChatOpen(true);
    } else {
      setActiveChat(updated[index]);
    }
  };

  const closeChatRoom = () => {
    setActiveChat(null);
    setSakuyaChatOpen(false);
    setYushiChatOpen(false);
    setRikuChatOpen(false);
    setSionChatOpen(false);
    setRyoChatOpen(false);
    setJaeheeChatOpen(false);
  };

  const isHome =
    !activeChat &&
    !sakuyaChatOpen &&
    !yushiChatOpen &&
    !rikuChatOpen &&
    !sionChatOpen &&
    !ryoChatOpen &&
    !jaeheeChatOpen;

  return (
    <div className="relative flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white text-sm font-medium border-x border-gray-200">
      <audio ref={audioRef} autoPlay loop>
        <source
          src="/audio/NCT WISH (엔시티 위시) Steady Official Audio.mp3"
          type="audio/mpeg"
        />
      </audio>

      {isHome ? (
        <>
          <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b">
            <span className="text-lg font-semibold">
              {activeTab === "friends" ? "친구" : "채팅"}
            </span>
            <HeadphonesIcon
              className="w-5 h-5 text-gray-700 cursor-pointer"
              onClick={toggleAudio}
            />
          </div>

          {activeTab === "friends" && (
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center">
                <label htmlFor="profile-upload" className="cursor-pointer">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="프로필"
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-300 mr-3" />
                  )}
                  <input
                    type="file"
                    id="profile-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onBlur={handleNicknameSave}
                  placeholder="닉네임 입력"
                  className="font-semibold outline-none w-[80px] text-sm"
                />
              </div>
              <div className="flex items-center border border-blue-400 text-blue-500 text-xs rounded-full px-2 py-1">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="전화번호 입력"
                  className="outline-none bg-transparent text-blue-500 w-[100px] text-xs"
                />
                <button onClick={handlePhoneSave} className="ml-1 font-bold">
                  +
                </button>
              </div>
            </div>
          )}

          <div className="px-4 pt-2 text-xs text-gray-500">
            {activeTab === "friends" && `친구 ${friends.length}`}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            {activeTab === "friends"
              ? friends.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedFriend(f)}
                  >
                    <div className="flex items-center">
                      <img
                        src={f.image}
                        alt={f.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <span>{f.name}</span>
                    </div>
                    <div className="border border-blue-300 text-blue-500 rounded-full px-3 py-1 text-xs">
                      {f.status}
                    </div>
                  </div>
                ))
              : messages.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => handleChatClick(idx)}
                  >
                    <div className="flex items-center">
                      <img
                        src={m.image}
                        alt={m.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-gray-600 text-xs">{m.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{m.time}</div>
                      {m.unreadCount > 0 && (
                        <div className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center mt-1">
                          {m.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
          </div>

          <div className="flex justify-around items-center py-3 border-t text-xs bg-white">
            <div
              className={`flex flex-col items-center cursor-pointer ${
                activeTab === "friends" ? "text-blue-500" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("friends")}
            >
              <UserIcon
                className="w-6 h-6"
                fill={activeTab === "friends" ? "#3B82F6" : "#9CA3AF"}
              />
              <span className="mt-1 text-[10px]">친구</span>
            </div>
            <div
              className={`flex flex-col items-center relative cursor-pointer ${
                activeTab === "chat" ? "text-blue-500" : "text-gray-400"
              }`}
              onClick={() => setActiveTab("chat")}
            >
              <ChatIcon
                className="w-6 h-6"
                fill={activeTab === "chat" ? "#3B82F6" : "#9CA3AF"}
              />
              <span className="mt-1 text-[10px]">채팅</span>
              {unreadTotal > 0 && (
                <div className="absolute -top-1.5 right-0 bg-red-500 text-white text-[10px] px-1 rounded-full">
                  {unreadTotal}
                </div>
              )}
            </div>
          </div>
        </>
      ) : sakuyaChatOpen ? (
        <SakuyaChat onBack={closeChatRoom} userName={nickname} />
      ) : yushiChatOpen ? (
        <YushiChat onBack={closeChatRoom} userName={nickname} />
      ) : rikuChatOpen ? (
        <RikuChat onBack={closeChatRoom} userName={nickname} />
      ) : sionChatOpen ? (
        <SionChat onBack={closeChatRoom} userName={nickname} />
      ) : ryoChatOpen ? (
        <RyoChat onBack={closeChatRoom} userName={nickname} />
        ) : jaeheeChatOpen ? (
        <JaeheeChat onBack={closeChatRoom} userName={nickname} />
      
      ) : (
        <ChatRoom chat={activeChat} onClose={closeChatRoom} />
      )}

      {selectedFriend && (
        <div
          className="absolute top-0 left-0 w-full h-full max-w-[390px] bg-cover bg-center z-50"
          style={{
            backgroundImage: `url(${
              selectedFriend.name === "리쿠"
                ? "/images/리쿠배경.jpg"
                : selectedFriend.name === "사쿠야"
                ? "/images/사쿠배경.jpg"
                : "/배경화면.jpg"
            })`,
          }}
        >
          <div className="flex justify-start items-start p-4">
            <CloseIcon
              className="w-6 h-6 text-white cursor-pointer"
              onClick={() => setSelectedFriend(null)}
            />
          </div>
          <div className="flex flex-col items-center justify-center h-[80%] text-white">
            <img
              src={selectedFriend.image}
              alt={selectedFriend.name}
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            <div className="text-xl font-semibold">{selectedFriend.name}</div>
            <div className="mt-1 text-sm">{selectedFriend.status}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendList;
