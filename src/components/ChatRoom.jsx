import React from "react";

const ChatRoom = ({ chat, onClose }) => {
  return (
    <div className="flex flex-col h-screen w-full max-w-[390px] mx-auto bg-white text-sm border-x border-gray-200">
      {/* 상단바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span className="text-lg font-semibold">{chat.name}</span>
        <img
          src="/icons/iconmonstr-x-mark-lined.svg"
          alt="닫기"
          className="w-5 h-5 cursor-pointer"
          onClick={onClose}
        />
      </div>

      {/* 채팅 내용 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chat.messages?.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === chat.name ? "justify-start" : "justify-end"}`}
          >
            <div>
              <div
                className={`px-3 py-2 rounded-lg max-w-[250px] ${
                  msg.sender === chat.name
                    ? "bg-gray-200 text-black"
                    : "bg-blue-500 text-white"
                }`}
              >
                {msg.text}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">{msg.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatRoom;
