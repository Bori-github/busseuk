const ICON_SIZE = 20;
const OUTER_SIZE = ICON_SIZE * 2;

export const createUserMarkerIcon = (): naver.maps.HtmlIcon => {
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    width: `${OUTER_SIZE}px`,
    height: `${OUTER_SIZE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  });

  const outer = document.createElement('div');
  Object.assign(outer.style, {
    position: 'absolute',
    width: `${OUTER_SIZE}px`,
    height: `${OUTER_SIZE}px`,
    background: 'rgba(59,130,246,0.2)',
    borderRadius: '50%',
  });

  const inner = document.createElement('div');
  Object.assign(inner.style, {
    width: `${ICON_SIZE}px`,
    height: `${ICON_SIZE}px`,
    background: '#3B82F6',
    border: '3px solid #ffffff',
    borderRadius: '50%',
    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    position: 'relative',
  });

  wrapper.appendChild(outer);
  wrapper.appendChild(inner);

  return {
    content: wrapper.outerHTML,
    size: new naver.maps.Size(OUTER_SIZE, OUTER_SIZE),
    anchor: new naver.maps.Point(OUTER_SIZE / 2, OUTER_SIZE / 2),
  };
};
