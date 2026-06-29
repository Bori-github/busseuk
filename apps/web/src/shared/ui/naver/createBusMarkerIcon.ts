import { toMeasuredHtmlIcon } from './htmlIcon';

interface CreateBusMarkerIconOptions {
  /** 노선 번호 (예: 152) */
  routeName: string;
  /** 배지 배경색 (hex) */
  color: string;
  /** 진행 방면 (예: 화계사방면) */
  direction?: string;
}

export const createBusMarkerIcon = ({
  routeName,
  color,
  direction,
}: CreateBusMarkerIconOptions): naver.maps.HtmlIcon => {
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  });

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
  badge.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
    <span>${routeName}</span>
  `.trim();
  wrapper.appendChild(badge);

  if (direction) {
    const label = document.createElement('span');
    label.textContent = direction;
    Object.assign(label.style, {
      fontSize: '10px',
      fontWeight: '600',
      lineHeight: '1.2',
      color: '#fff',
      whiteSpace: 'nowrap',
      textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.6)',
    });
    wrapper.appendChild(label);
  }

  // 배지 중심을 버스 위치 좌표에 맞춘다 (방면 라벨은 배지 아래에 매달린다)
  return toMeasuredHtmlIcon(wrapper, ({ width }) => ({
    x: width / 2,
    y: badge.offsetHeight / 2,
  }));
};
