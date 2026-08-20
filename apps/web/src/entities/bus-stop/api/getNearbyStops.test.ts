import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NearbyStopItem } from '../model/types';
import { getNearbyStops, NEARBY_RADIUS_METERS } from './getNearbyStops';

import { busGet, BusApiError } from '@shared/api';

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>();

  return {
    ...actual,
    busGet: vi.fn(),
  };
});

const createItem = (overrides: Partial<NearbyStopItem> = {}): NearbyStopItem => ({
  stationId: '102900092',
  stationNm: '도원삼성래미안아파트단지내',
  arsId: '03737',
  gpsX: '126.9553881353',
  gpsY: '37.5381983039',
  dist: '48',
  stationTp: '0',
  ...overrides,
});

describe('getNearbyStops', () => {
  beforeEach(() => {
    vi.mocked(busGet).mockReset();
  });

  it('좌표와 반경으로 getStationByPos API를 호출한다', async () => {
    vi.mocked(busGet).mockResolvedValue([]);

    await getNearbyStops(37.53843986, 126.9558493);

    expect(busGet).toHaveBeenCalledWith('/stationinfo/getStationByPos', {
      tmX: '126.9558493',
      tmY: '37.53843986',
      radius: String(NEARBY_RADIUS_METERS),
    });
  });

  it('응답 항목을 좌표가 파싱된 정류장으로 매핑한다', async () => {
    vi.mocked(busGet).mockResolvedValue([createItem()]);

    const stops = await getNearbyStops(37.53843986, 126.9558493);

    expect(stops).toEqual([
      {
        stationId: '102900092',
        arsId: '03737',
        name: '도원삼성래미안아파트단지내',
        lat: 37.5381983039,
        lng: 126.9553881353,
        distanceMeters: 48,
      },
    ]);
  });

  it('도착정보가 없는 미정차 정류장(arsId "0" 또는 빈 값)은 제외한다', async () => {
    vi.mocked(busGet).mockResolvedValue([
      createItem({ stationId: '277102911', stationNm: '강남역10번출구(미정차)', arsId: '0' }),
      createItem({ stationId: '277104283', stationNm: '시청교차로(미정차)', arsId: '' }),
      createItem({ stationId: '102900092', arsId: '03737' }),
    ]);

    const stops = await getNearbyStops(37.4979, 127.0276);

    expect(stops.map((stop) => stop.stationId)).toEqual(['102900092']);
  });

  it('좌표가 숫자가 아닌 정류장은 제외한다', async () => {
    vi.mocked(busGet).mockResolvedValue([
      createItem({ stationId: '1', gpsY: '', gpsX: '126.9' }),
      createItem({ stationId: '2', gpsY: 'N/A', gpsX: '126.9' }),
      createItem({ stationId: '3' }),
    ]);

    const stops = await getNearbyStops(37.5, 127);

    expect(stops.map((stop) => stop.stationId)).toEqual(['3']);
  });

  it('좌표가 0인 정류장은 제외한다', async () => {
    vi.mocked(busGet).mockResolvedValue([createItem({ stationId: '1', gpsY: '0', gpsX: '0' }), createItem({ stationId: '2' })]);

    const stops = await getNearbyStops(37.5, 127);

    expect(stops.map((stop) => stop.stationId)).toEqual(['2']);
  });

  it('주변에 정류장이 없으면(headerCd 4) 빈 목록을 돌려준다', async () => {
    vi.mocked(busGet).mockRejectedValue(new BusApiError('4', '결과가 없습니다.'));

    await expect(getNearbyStops(33.4996, 126.5312)).resolves.toEqual([]);
  });

  it('빈 결과가 아닌 API 오류는 그대로 던진다', async () => {
    const apiError = new BusApiError('6', '서비스 이용 제한');
    vi.mocked(busGet).mockRejectedValue(apiError);

    await expect(getNearbyStops(37.5, 127)).rejects.toThrow(apiError);
  });

  it('네트워크 오류는 삼키지 않고 던진다', async () => {
    const networkError = new Error('버스 API 네트워크 오류: timeout');
    vi.mocked(busGet).mockRejectedValue(networkError);

    await expect(getNearbyStops(37.5, 127)).rejects.toThrow(networkError);
  });
});
