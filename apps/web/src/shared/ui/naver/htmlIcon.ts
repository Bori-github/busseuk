interface IconAnchor {
  x: number;
  y: number;
}

/**
 * 엘리먼트를 화면 밖에서 측정해 naver HtmlIcon으로 변환한다.
 *
 * 크기를 모르는 HTML 마커는 실제 렌더 크기를 알아야 size·anchor를 지정할 수 있다.
 * 화면 밖(visibility hidden + position fixed)에 잠시 부착해 offsetWidth/Height를 읽고 제거한다.
 * resolveAnchor는 엘리먼트가 DOM에 부착된 동안 호출되므로, 자식 엘리먼트의 크기도 읽을 수 있다.
 */
export const toMeasuredHtmlIcon = (
  element: HTMLElement,
  resolveAnchor: (size: { width: number; height: number }) => IconAnchor,
): naver.maps.HtmlIcon => {
  element.style.visibility = 'hidden';
  element.style.position = 'fixed';
  element.style.top = '0';
  element.style.left = '0';
  document.body.appendChild(element);

  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const anchor = resolveAnchor({ width, height });

  document.body.removeChild(element);
  element.style.visibility = '';
  element.style.position = '';
  element.style.top = '';
  element.style.left = '';

  return {
    content: element.outerHTML,
    size: new window.naver.maps.Size(width, height),
    anchor: new window.naver.maps.Point(anchor.x, anchor.y),
  };
};
