const ICON_SIZE = 24;
const GAP = 4;

interface CreateBusStopMarkerIconOptions {
  name: string;
}

export const createBusStopMarkerIcon = ({
  name,
}: CreateBusStopMarkerIconOptions): naver.maps.HtmlIcon => {
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: `${GAP}px`,
  });

  const icon = document.createElement('div');
  Object.assign(icon.style, {
    width: `${ICON_SIZE}px`,
    height: `${ICON_SIZE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#EF4444',
    border: '2px solid #DC2626',
    borderRadius: '50%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
    flexShrink: '0',
  });
  icon.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
  `.trim();

  const label = document.createElement('span');
  label.textContent = name;
  Object.assign(label.style, {
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '1.2',
    color: '#fff',
    whiteSpace: 'nowrap',
    textShadow:
      '0 1px 2px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.6)',
  });

  wrapper.appendChild(icon);
  wrapper.appendChild(label);

  wrapper.style.visibility = 'hidden';
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '0';
  document.body.appendChild(wrapper);
  const markerWidth = wrapper.offsetWidth;
  const markerHeight = wrapper.offsetHeight;
  document.body.removeChild(wrapper);

  wrapper.style.visibility = '';
  wrapper.style.position = '';
  wrapper.style.top = '';
  wrapper.style.left = '';

  return {
    content: wrapper.outerHTML,
    size: new window.naver.maps.Size(markerWidth, markerHeight),
    anchor: new window.naver.maps.Point(markerWidth / 2, ICON_SIZE / 2),
  };
};
