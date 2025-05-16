import React from 'react';

const ProfileDetail = ({ member, onClose }) => {
  if (!member) return null;

  // 공백 제거 후 닉네임 기준으로 배경 이미지 설정
  const getBackgroundImage = (nickname) => {
    const cleanName = nickname.trim();
    switch (cleanName) {
      case '리쿠':
        return "/images/리쿠배경.jpg?v=1"; // 캐시 무효화용 쿼리 추가
      case '사쿠야':
        return "/images/사쿠배경.jpg?v=1";
      default:
        return "/배경화면.jpg?v=1";
    }
  };

  const backgroundImageUrl = getBackgroundImage(member.nickname);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <div
        className="relative w-[90%] max-w-sm min-h-[400px] bg-cover bg-center rounded-xl overflow-hidden shadow-lg"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      >
        {/* 나가기 버튼 */}
        <button
          className="absolute top-4 right-4 text-white w-6 h-6"
          onClick={onClose}
          aria-label="닫기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full"
          >
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M12 10.93l5.719-5.72a.75.75 0 011.281.531.75.75 0 01-.219.532l-5.72 5.719 5.719 5.719a.75.75 0 01-.531 1.281.75.75 0 01-.531-.219l-5.719-5.719-5.719 5.719a.75.75 0 01-.531.219.75.75 0 01-.75-.75c0-.192.073-.384.22-.531l5.719-5.719-5.72-5.719a.75.75 0 011.281-.532l5.719 5.72z"
            />
          </svg>
        </button>

        {/* 프로필 본문 */}
        <div className="flex flex-col items-center justify-center p-6 text-white backdrop-blur-sm bg-black/40 rounded-b-xl">
          <img
            src={member.profileImage}
            alt={member.nickname}
            className="w-24 h-24 rounded-full border-4 border-white mb-4 object-cover"
          />
          <h2 className="text-xl font-semibold">{member.nickname}</h2>
          <p className="text-sm mt-2">{member.phoneNumber}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetail;
