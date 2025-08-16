/**
 * 시간 관련 유틸리티 함수들
 */

/**
 * JWT 만료 시간 문자열을 초 단위로 변환
 * @param expireTime - 만료 시간 문자열 (예: '1h', '30m', '3600s', '1d')
 * @returns 초 단위의 만료 시간
 */
export function parseExpireTime(expireTime: string): number {
  if (expireTime.endsWith('s')) {
    return parseInt(expireTime.slice(0, -1));
  } else if (expireTime.endsWith('m')) {
    return parseInt(expireTime.slice(0, -1)) * 60;
  } else if (expireTime.endsWith('h')) {
    return parseInt(expireTime.slice(0, -1)) * 3600;
  } else if (expireTime.endsWith('d')) {
    return parseInt(expireTime.slice(0, -1)) * 86400;
  }
  return parseInt(expireTime);
}

/**
 * 초 단위를 읽기 쉬운 형식으로 변환
 * @param seconds - 초 단위 시간
 * @returns 읽기 쉬운 형식 (예: '1시간 30분')
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}초`);

  return parts.join(' ') || '0초';
}
