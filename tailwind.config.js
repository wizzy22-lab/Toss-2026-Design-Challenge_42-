/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // V2: 오렌지 = 분위기·강조(프레임·글로우·액센트). 텍스트는 다크. 버튼은 다크.
        //  - 작은 오렌지 텍스트/아이콘 = 600 #C23E12(accent-small, AA 5.04)
        //  - 큰 강조어(≥24px)·프레임·토글 = flame #F5591C(accent-large 3.18, ≥24px만)
        brand: {
          50: "#FFF3EC",
          100: "#FFE1CE",
          400: "#FF8340",
          500: "#FF6A2C", // bright 액센트(글로우·진행바) — 비텍스트
          600: "#C23E12", // accent-small — 작은 오렌지 텍스트/아이콘 (AA 5.04)
          700: "#A5330E", // hover(작은 오렌지 텍스트)
          800: "#8A2B0C",
        },
        flame: "#F5591C", // accent-large / 프레임 / 토글 on — 큰 글자(≥24px)·장식 전용
        deep: "#CE3F0C", // 딥 오렌지 필 버튼(필요시만, 흰 텍스트 4.84:1)
        // 텍스트 위계 (V2 §2, 전부 AA 검증 · tertiary만 장식용)
        ink: {
          DEFAULT: "#1C1510", // 제목·본문 (17.3:1)
          soft: "#6E6259", // 보조·읽히는 뮤트 (5.66:1)
          faint: "#726A61", // 메타·뮤트 — 읽힘 유지(4.53:1)
          disabled: "#A99E94", // placeholder·disabled·장식만 (본문 금지)
          hover: "#33291F", // 다크 primary 버튼 hover(bg-ink 위 lift)
        },
        // 표면 (크림 + 다크 텍스트)
        cream: "#FFF9F4", // page 배경
        surface: "#FFFDFB", // 카드
        edge: "#9C9186", // 인풋·아웃라인 경계 — 1.4.11 조작요소 3:1(3.08)
        // 시맨틱 상태 컬러 (V2 §4) — 대비 통일 ~4.5 + 패턴/아이콘 병행
        avoid: { DEFAULT: "#FBEDC8", ink: "#8C6200" }, // 피해요(soft) = 앰버(4.67:1)
        ok: { DEFAULT: "#E3F3E7", ink: "#137A3B" }, // 응답 완료 / 가능 = 그린(4.71:1)
        block: { DEFAULT: "#EBE4DC", ink: "#6E6152" }, // 불가(hard) = 웜 중립(4.77:1)
        wait: { DEFAULT: "#F1ECE7", ink: "#726A61" }, // 미응답 — 저채도+아이콘, 대비는 지킴(4.53)
        danger: { DEFAULT: "#FBE2DF", ink: "#C0352A" }, // 에러 / 취소 = 레드(4.50:1)
        recommend: { DEFAULT: "#FFE3D2", ink: "#B8390F" }, // 최선·추천 태그(4.73:1)
        // 웜 뉴트럴 표면/테두리
        paper: "#FFFBF8",
        sand: { 50: "#F7F1EC", 100: "#EFE7E0", 200: "#E7DDD3", 300: "#DDD2C7" },
        line: { DEFAULT: "#EAE0D8", soft: "#F0E8E1" }, // hairline(비조작 카드 구획)
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)", // shadow-1 (문서 §2)
        pop: "0 12px 32px rgba(0,0,0,0.18)", // shadow-3 (모달)
        glow: "0 8px 28px rgba(245,89,28,0.28)", // vivid CTA 글로우
      },
    },
  },
  plugins: [],
};
