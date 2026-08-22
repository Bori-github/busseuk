import type { NearbyStation } from '@entities/station';

interface StationMarkerDiffInput {
  /** 지도에 있어야 할 정류장. 줌이 임계 미만이면 빈 배열을 넘겨 전부 제거 */
  stations: NearbyStation[];
  /** 지도에 이미 올라간 마커의 stationId */
  existingIds: Iterable<string>;
  selectedStationId: string | null;
  prevSelectedStationId: string | null;
  /** 줌이 임계를 넘나들면 아이콘 모양이 달라지므로 기존 마커 전부 다시 씌움 */
  detailed: boolean;
  prevDetailed: boolean;
}

interface StationMarkerDiff {
  added: NearbyStation[];
  removed: string[];
  /** 선택 여부가 바뀌어 아이콘만 새로 씌울 정류장 */
  reiconed: NearbyStation[];
}

/**
 * 마커를 전부 다시 만들지 않고 재사용하기 위한 diff. SDK 객체는 만들지 않음.
 *
 * 키로 `stationId`를 씀. `arsId`는 응답 내에서 유일하지 않아 마커가 서로 덮임.
 */
export const diffStationMarkers = ({
  stations,
  existingIds,
  selectedStationId,
  prevSelectedStationId,
  detailed,
  prevDetailed,
}: StationMarkerDiffInput): StationMarkerDiff => {
  const existing = new Set(existingIds);
  const next = new Map(stations.map((station) => [station.stationId, station]));

  const added = stations.filter((station) => !existing.has(station.stationId));
  const removed = [...existing].filter((id) => !next.has(id));
  const addedIds = new Set(added.map((station) => station.stationId));

  const selectionChanged = prevSelectedStationId === selectedStationId ? [] : [prevSelectedStationId, selectedStationId];

  const reiconTargets = detailed === prevDetailed ? selectionChanged : [...existing];

  // 새로 만드는 마커는 생성 시 아이콘을 받으므로 다시 씌우지 않음
  const reiconed = reiconTargets.flatMap((id) => {
    if (id === null || addedIds.has(id)) return [];
    const station = next.get(id);

    return station ? [station] : [];
  });

  return { added, removed, reiconed };
};
