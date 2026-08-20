import { MapHint } from '@shared/ui';

/**
 * 마커가 안 보일 때 "버스 없음"과 구분되도록 확대를 안내.
 * 노출 조건은 상위(MapPage)에서 판단.
 */
export const BusZoomHint = () => <MapHint>지도를 확대하면 실시간 버스 위치가 표시됩니다</MapHint>;
