export const State = {
  Activation: 'Activation', // 활성화
  Deleted: 'Deleted', // 삭제
} as const;
export type State = (typeof State)[keyof typeof State];
