import type { SlotResult } from "./engine";

/**
 * 메시지 라이팅 — 목적/독려/회피를 문구에 고정한다. (대면 전용 · 축은 '시간' 하나)
 * 요청: 쉽고 빠르다는 안심(압박·죄책감 회피).
 * 확정: 신뢰·배려(누가 양보했는지 콕 집지 않기).
 * 리마인드: 부드럽게(이름 콕 집는 공개 망신 회피).
 * 변경: 중립(특정인 탓 안 나게).
 */

/** 요청 카드 — 응답 전 참석자가 받는 안내 */
export function requestLine(hostName: string, title: string): string {
  return `${hostName}님이 '${title}'를 잡고 있어요. 안 되는 시간만 알려주세요.`;
}

/**
 * 확정 공지 — 응답 후 모두가 받는 안내 (누가 양보했는지 콕 집지 않음).
 * '되는'을 양쪽에 쓰면 모순 → 편함(선호) vs 올 수 있음(가능)으로 구분.
 * 트레이드오프 상세(누가/왜 불편)는 주최자 화면에서만 다룬다.
 */
export function confirmedLine(title: string, slotKorean: string): string {
  return `'${title}'가 ${slotKorean}로 정해졌어요. 다들 올 수 있는 시간으로 정했어요.`;
}

/**
 * 추천의 트레이드오프 — "누가/왜 조금 불편"을 투명하게.
 * 완벽한 시간이 없다는 걸 감추지 않고, 최선인 이유를 정직하게 보여준다.
 */
export function tradeoffLine(r: SlotResult): string {
  if (r.softViolations === 0) return "선호 충돌 없이 딱 맞는 시간이에요.";
  const names = r.softNames.map((n) => `${n}님`).join("·");
  return `${names}이 이 시간을 피하고 싶어 했어요. 그래도 필수 참석자는 모두 올 수 있는 최선이에요.`;
}

/** 변경 공지 ⓓ — 중립적으로, 특정인 탓 안 나게 */
export function changeAnnounceLine(
  kind: "drop" | "reschedule" | "cancel",
  title: string,
  changerName: string,
  fromKorean: string,
  toKorean: string,
): string {
  if (kind === "cancel") {
    // 특정인 탓 안 나게 — 중립적으로
    return `'${title}' 회의가 취소됐어요. 이번엔 다들 되는 시간을 찾지 못했어요 — 나중에 다시 잡아요.`;
  }
  if (kind === "drop") {
    return `'${title}'는 ${fromKorean} 그대로예요. ${changerName}님은 이번엔 함께하지 못해요 — 결과는 공유돼요.`;
  }
  return `'${title}' 시간이 ${fromKorean} → ${toKorean}로 조정됐어요. 받아둔 응답 그대로 다시 맞췄어요.`;
}
