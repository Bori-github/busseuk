import type { StationInformation } from './types';

/** 테스트용 정류장 노선 도착정보 픽스처. overrides로 일부 필드만 바꿔 쓴다. */
export const mockStationInformation = (
  overrides: Partial<StationInformation> = {},
): StationInformation => ({
  busRouteId: '100100118',
  busRouteAbrv: '753',
  rtNm: '753',
  routeType: '3',
  adirection: '신설동',
  arrmsg1: '3분후[2번째 전]',
  arrmsg2: '-',
  ...overrides,
});
