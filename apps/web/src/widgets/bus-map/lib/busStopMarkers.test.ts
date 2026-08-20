import { describe, expect, it } from 'vitest';

import { diffBusStopMarkers } from './busStopMarkers';

import type { BusStop } from '@entities/bus-stop';

const stop = (stationId: string): BusStop => ({
  stationId,
  arsId: `ars-${stationId}`,
  name: `정류장 ${stationId}`,
  lat: 37.4979,
  lng: 127.0276,
  distanceMeters: 100,
});

const ids = (stops: BusStop[]) => stops.map((s) => s.stationId);

const diff = (input: Partial<Parameters<typeof diffBusStopMarkers>[0]> = {}) =>
  diffBusStopMarkers({
    stops: [],
    existingIds: [],
    selectedStationId: null,
    prevSelectedStationId: null,
    detailed: true,
    prevDetailed: true,
    ...input,
  });

describe('diffBusStopMarkers', () => {
  it('지도에 없던 정류장만 추가한다', () => {
    const result = diff({ stops: [stop('A'), stop('B')], existingIds: ['A'] });

    expect(ids(result.added)).toEqual(['B']);
  });

  it('목록에서 사라진 정류장을 제거한다', () => {
    const result = diff({ stops: [stop('A')], existingIds: ['A', 'B'] });

    expect(result.removed).toEqual(['B']);
  });

  it('그대로인 정류장은 어느 목록에도 넣지 않는다', () => {
    const result = diff({ stops: [stop('A')], existingIds: ['A'] });

    expect(result).toEqual({ added: [], removed: [], reiconed: [] });
  });

  it('줌아웃으로 목록이 비면 전부 제거한다', () => {
    const result = diff({ stops: [], existingIds: ['A', 'B'] });

    expect(result.removed).toEqual(['A', 'B']);
  });

  it('선택이 바뀌면 이전·새 선택 둘 다 아이콘을 새로 씌운다', () => {
    const result = diff({
      stops: [stop('A'), stop('B')],
      existingIds: ['A', 'B'],
      prevSelectedStationId: 'A',
      selectedStationId: 'B',
    });

    expect(ids(result.reiconed)).toEqual(['A', 'B']);
  });

  it('선택이 그대로면 아이콘을 다시 씌우지 않는다', () => {
    const result = diff({
      stops: [stop('A')],
      existingIds: ['A'],
      prevSelectedStationId: 'A',
      selectedStationId: 'A',
    });

    expect(result.reiconed).toEqual([]);
  });

  it('새로 추가되는 정류장은 아이콘 대상에서 뺀다', () => {
    // 생성 시 선택 아이콘을 받으므로, 넣으면 같은 마커에 setIcon이 두 번 돎
    const result = diff({
      stops: [stop('A')],
      existingIds: [],
      prevSelectedStationId: null,
      selectedStationId: 'A',
    });

    expect(ids(result.added)).toEqual(['A']);
    expect(result.reiconed).toEqual([]);
  });

  it('줌이 임계를 넘나들면 기존 마커 전부 아이콘을 다시 씌운다', () => {
    const result = diff({
      stops: [stop('A'), stop('B')],
      existingIds: ['A', 'B'],
      detailed: false,
      prevDetailed: true,
    });

    expect(ids(result.reiconed)).toEqual(['A', 'B']);
  });

  it('줌 상세도가 그대로면 선택 변경분만 다시 씌운다', () => {
    const result = diff({
      stops: [stop('A'), stop('B')],
      existingIds: ['A', 'B'],
      prevSelectedStationId: 'A',
      selectedStationId: 'B',
      detailed: false,
      prevDetailed: false,
    });

    expect(ids(result.reiconed)).toEqual(['A', 'B']);
  });

  it('제거되는 정류장은 아이콘 대상에서 뺀다', () => {
    const result = diff({
      stops: [stop('B')],
      existingIds: ['A', 'B'],
      prevSelectedStationId: 'A',
      selectedStationId: 'B',
    });

    expect(result.removed).toEqual(['A']);
    expect(ids(result.reiconed)).toEqual(['B']);
  });
});
