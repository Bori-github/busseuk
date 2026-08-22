import { toMeasuredHtmlIcon } from './htmlIcon';

const DOT_SIZE = 10;
const NEARBY_SIZE = 24;
const SELECTED_SIZE = 32;

/** 선택 마커 꼬리. 좌표를 집는 뾰족한 끝 */
const TIP_HEIGHT = 8;
const TIP_WIDTH = 12;
/** 꼬리를 원에 겹쳐 이어 보이게 하는 양 */
const TIP_OVERLAP = 2;

const LABEL_GAP = 4;

const FILL = '#EF4444';
const STROKE = '#DC2626';

export const STATION_PIN_TIP_SELECTOR = '[data-station-pin-tip]';

export type StationMarkerVariant = 'selected' | 'default' | 'dot';

const SIZE: Record<StationMarkerVariant, number> = {
  selected: SELECTED_SIZE,
  default: NEARBY_SIZE,
  dot: DOT_SIZE,
};

interface CreateStationMarkerIconOptions {
  name: string;
  variant?: StationMarkerVariant;
}

const createCircle = (size: number, withGlyph: boolean): HTMLElement => {
  const circle = document.createElement('div');
  Object.assign(circle.style, {
    width: `${size}px`,
    height: `${size}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: FILL,
    border: `${withGlyph ? 2 : 1.5}px solid ${STROKE}`,
    borderRadius: '50%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
    flexShrink: '0',
  });

  if (!withGlyph) return circle;

  const glyph = Math.round(size * 0.58);
  circle.innerHTML = `
    <svg width="${glyph}" height="${glyph}" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
  `.trim();

  return circle;
};

const createTip = (): HTMLElement => {
  const tip = document.createElement('div');
  tip.dataset.stationPinTip = '';
  Object.assign(tip.style, {
    width: '0',
    height: '0',
    borderLeft: `${TIP_WIDTH / 2}px solid transparent`,
    borderRight: `${TIP_WIDTH / 2}px solid transparent`,
    borderTop: `${TIP_HEIGHT}px solid ${STROKE}`,
    marginTop: `-${TIP_OVERLAP}px`,
  });

  return tip;
};

const createLabel = (name: string): HTMLElement => {
  const label = document.createElement('span');
  label.textContent = name;
  Object.assign(label.style, {
    marginTop: `${LABEL_GAP}px`,
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '1.2',
    color: '#fff',
    whiteSpace: 'nowrap',
    textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.6)',
  });

  return label;
};

/**
 * 선택 마커는 꼬리 끝, 나머지는 원 중심이 좌표에 놓임.
 * 기준이 달라 크기에서 앵커를 곧바로 유도할 수 없음.
 */
const resolveAnchorY = (variant: StationMarkerVariant): number =>
  variant === 'selected' ? SELECTED_SIZE + TIP_HEIGHT - TIP_OVERLAP : SIZE[variant] / 2;

export const createStationMarkerIcon = ({ name, variant = 'default' }: CreateStationMarkerIconOptions): naver.maps.HtmlIcon => {
  const selected = variant === 'selected';

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  });

  wrapper.appendChild(createCircle(SIZE[variant], variant !== 'dot'));

  if (selected) {
    wrapper.appendChild(createTip());
    wrapper.appendChild(createLabel(name));
  }

  return toMeasuredHtmlIcon(wrapper, ({ width }) => ({
    x: width / 2,
    y: resolveAnchorY(variant),
  }));
};
