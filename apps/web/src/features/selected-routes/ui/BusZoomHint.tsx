/**
 * 버스 마커는 줌 임계값(BUS_MARKER_MIN_ZOOM) 이상에서만 표시된다.
 * 선택한 노선이 있는데 줌이 낮아 마커가 안 보일 때, "버스가 없는 것"과 구분되도록
 * 확대를 안내한다. 노출 여부(선택 노선 유무 · 마커 가시성)는 상위(MapPage)에서 판단한다.
 */
export const BusZoomHint = () => (
  <div className="self-center rounded-full bg-black/80 px-3 py-1.5 text-xs text-gray-300 shadow-md">
    지도를 확대하면 실시간 버스 위치가 표시됩니다
  </div>
);
