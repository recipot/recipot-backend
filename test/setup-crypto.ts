// Jest E2E 테스트를 위한 crypto polyfill
import { webcrypto } from 'crypto';

// Node.js 18+ 환경에서 crypto를 전역으로 설정
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto as any;
}
