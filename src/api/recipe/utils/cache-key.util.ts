import { createHash } from 'crypto';

/**
 * ID 배열을 정규화하고 해시화합니다.
 * @param ids ID 배열
 * @returns 정규화된 배열과 해시값
 */
export function normalizeAndHash(ids: number[] = []): {
  list: number[];
  hash: string;
} {
  const arr = Array.from(new Set(ids)).sort((a, b) => a - b);
  const raw = JSON.stringify(arr);
  return {
    list: arr,
    hash: createHash('sha1').update(raw).digest('hex').slice(0, 16),
  };
}

/**
 * 레시피 추천 캐시 키를 생성합니다.
 * @param conditionId 컨디션 ID
 * @param pantry 보유 재료 ID 배열
 * @param unavailable 사용 불가 재료 ID 배열
 * @returns 캐시 키
 */
export function cacheKey(
  conditionId: number,
  pantry: number[],
  unavailable: number[],
): string {
  const v = 'v1'; // 캐시 버전
  const p = normalizeAndHash(pantry).hash;
  const u = normalizeAndHash(unavailable).hash;
  return `recommend:${v}:c:${conditionId}:p:${p}:u:${u}`;
}

/**
 * 락 키를 생성합니다.
 * @param mainKey 메인 캐시 키
 * @returns 락 키
 */
export function lockKey(mainKey: string): string {
  return `${mainKey}:lock`;
}
