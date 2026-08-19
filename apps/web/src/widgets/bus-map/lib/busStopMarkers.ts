import type { BusStop } from '@entities/bus-stop';

interface BusStopMarkerDiffInput {
  /** 지도에 있어야 할 정류장. 줌이 임계 미만이면 빈 배열을 넘겨 전부 제거한다 */
  stops: BusStop[];
  /** 지도에 이미 올라간 마커의 stationId */
  existingIds: Iterable<string>;
  selectedStationId: string | null;
  prevSelectedStationId: string | null;
}

interface BusStopMarkerDiff {
  added: BusStop[];
  removed: string[];
  /** 선택 여부가 바뀌어 아이콘만 새로 씌울 정류장 */
  reiconed: BusStop[];
}

/**
 * 마커를 전부 다시 만들지 않고 재사용하기 위한 diff. SDK 객체는 만들지 않는다.
 *
 * 키는 `arsId`가 아니라 `stationId`다. `arsId`는 응답 내에서 유일하지 않아 마커가 서로 덮인다.
 */
export const diffBusStopMarkers = ({
  stops,
  existingIds,
  selectedStationId,
  prevSelectedStationId,
}: BusStopMarkerDiffInput): BusStopMarkerDiff => {
  const existing = new Set(existingIds);
  const next = new Map(stops.map((stop) => [stop.stationId, stop]));

  const added = stops.filter((stop) => !existing.has(stop.stationId));
  const removed = [...existing].filter((id) => !next.has(id));
  const addedIds = new Set(added.map((stop) => stop.stationId));

  const selectionChanged = prevSelectedStationId === selectedStationId ? [] : [prevSelectedStationId, selectedStationId];

  // 새로 만드는 마커는 생성 시 아이콘을 받으므로 다시 씌우지 않는다.
  const reiconed = selectionChanged.flatMap((id) => {
    if (id === null || addedIds.has(id)) return [];
    const stop = next.get(id);

    return stop ? [stop] : [];
  });

  return { added, removed, reiconed };
};
