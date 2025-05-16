import React, { useState, useEffect } from "react";

const getCurrentTime = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes().toString().padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const formattedHour = hour % 12 || 12;
  return `${period} ${formattedHour}:${minute}`;
};

const ChatList = ({ chats, setChats, setActiveTab }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [initialTime, setInitialTime] = useState("");

  useEffect(() => {
    setInitialTime(getCurrentTime());
  }, []);

  const openChat = (id) => {
    const updatedChats = chats.map((chat) =>
      chat.id === id
        ? {
            ...chat,
            unreadCount: 0,
            messages: chat.messages?.map((msg) => ({ ...msg, read: true })) || [],
          }
        : chat
    );
    setChats(updatedChats);
    setActiveChat(updatedChats.find((c) => c.id === id));
  };

  const goBack = () => setActiveChat(null);

  return (
    <div className="w-[375px] h-[812px] mx-auto border bg-white">
      <div className="flex items-center justify-center px-4 pt-4 pb-2 border-b">
        <span className="text-lg font-semibold">
          {activeChat ? activeChat.name : "채팅"}
        </span>
      </div>

      {!activeChat ? (
        <div>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-100"
            >
              <img
                src={chat.profileImg}
                alt={chat.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm">{chat.name}</span>
                  <span className="text-xs text-gray-500">{initialTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate w-[200px]">
                    {chat.lastMessage}
                  </span>
                  {chat.messages?.filter((msg) => !msg.read).length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {chat.messages.filter((msg) => !msg.read).length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b">
            <button onClick={goBack} className="mr-4 text-xl">
              ←
            </button>
            <span className="font-bold text-lg">{activeChat.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {activeChat.messages?.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  msg.sender === activeChat.name ? "items-start" : "items-end"
                }`}
              >
                <div
                  className={`text-sm px-3 py-2 rounded-lg max-w-[70%] ${
                    msg.sender === activeChat.name
                      ? "bg-gray-200 text-left"
                      : "bg-blue-500 text-white text-right"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1">{msg.time || initialTime}</span>
              </div>
            ))}
          </div>
          <div className="p-4">
            <button
              onClick={() => setActiveTab("friends")}
              className="text-sm text-blue-500"
            >
              친구 목록으로 가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
