import { toMeasuredHtmlIcon } from './htmlIcon';

/** 마커 안에서 방향 화살표 엘리먼트를 찾기 위한 셀렉터 (생성 후 회전 갱신용) */
export const BUS_ARROW_SELECTOR = '[data-bus-arrow]';

interface CreateBusMarkerIconOptions {
  /** 노선 번호 (예: 152) */
  routeName: string;
  /** 배지 배경색 (hex) */
  color: string;
  /**
   * 진행 방향(정북 0°, 시계방향 증가). 지정 시 방향 화살표를 표시한다.
   * 미지정이면 화살표를 그리지 않는다(방향 미상).
   */
  heading?: number;
}

export const createBusMarkerIcon = ({ routeName, color, heading }: CreateBusMarkerIconOptions): naver.maps.HtmlIcon => {
  const badge = document.createElement('div');
  Object.assign(badge.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    height: '22px',
    padding: '0 8px 0 6px',
    background: color,
    border: '2px solid rgba(255,255,255,0.9)',
    borderRadius: '11px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
    lineHeight: '1',
    whiteSpace: 'nowrap',
  });

  // 진행 방향 화살표: 정북(0°) 기준 위를 향하는 네비게이션 아이콘. heading만큼 시계방향 회전.
  // 화살표는 heading을 모를 때도 '항상' 배치하되 visibility:hidden으로 숨긴다.
  //  - 노선 경로(polyline)는 버스 위치보다 늦게 도착할 수 있어, 생성 시점엔 heading이 없을 수 있다.
  //    그때 화살표를 아예 안 만들면 이후 경로가 도착해도 붙일 곳이 없다(레이스 → 화살표 영구 미표시).
  //  - visibility:hidden은 레이아웃 공간을 유지하므로, 나중에 보이게 해도 측정한 너비·anchor가 흔들리지 않는다.
  // transform(rotate)은 레이아웃 박스를 바꾸지 않으므로 회전과 무관하게 anchor가 안정적이다.
  const arrow = document.createElement('span');
  arrow.dataset.busArrow = '';
  Object.assign(arrow.style, {
    display: 'flex',
    visibility: heading === undefined ? 'hidden' : 'visible',
    transformOrigin: 'center',
    transform: `rotate(${heading ?? 0}deg)`,
    transition: 'transform 0.3s ease-out',
  });
  arrow.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z"/>
    </svg>
  `.trim();
  badge.appendChild(arrow);

  // svg는 정적 마크업이라 innerHTML, 노선번호는 사용자 데이터이므로 textContent로 주입(이스케이프)
  const busIcon = document.createElement('span');
  busIcon.style.display = 'flex';
  busIcon.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
  `.trim();
  badge.appendChild(busIcon);

  const routeNameSpan = document.createElement('span');
  routeNameSpan.textContent = routeName;
  badge.appendChild(routeNameSpan);

  // 배지 중심을 버스 위치 좌표에 맞춘다
  return toMeasuredHtmlIcon(badge, ({ width, height }) => ({
    x: width / 2,
    y: height / 2,
  }));
};
