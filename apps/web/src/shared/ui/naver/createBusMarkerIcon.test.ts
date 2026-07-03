import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBusMarkerIcon } from './createBusMarkerIcon';

// toMeasuredHtmlIcon은 window.naver.maps.Size/Point를 사용하므로 최소 스텁을 둔다.
beforeEach(() => {
  vi.stubGlobal('naver', {
    maps: {
      Size: function (this: Record<string, number>, width: number, height: number) {
        this.width = width;
        this.height = height;
      },
      Point: function (this: Record<string, number>, x: number, y: number) {
        this.x = x;
        this.y = y;
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** HtmlIcon content 문자열을 DOM으로 파싱한다. */
const parseContent = (content: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = content;
  return host.firstElementChild as HTMLElement;
};

describe('createBusMarkerIcon', () => {
  it('노선 번호를 배지에 표시한다', () => {
    const icon = createBusMarkerIcon({ routeName: '152', color: '#0d3' });
    const badge = parseContent(icon.content as string);

    expect(badge.textContent).toContain('152');
  });

  it('heading 미지정 시 화살표는 배치하되 숨긴다(경로 지연 도착 대비)', () => {
    // 화살표를 아예 안 그리면 뒤늦게 heading이 생겨도 붙일 곳이 없다.
    // 항상 배치하되 visibility:hidden으로 숨겨 anchor를 안정적으로 유지한다.
    const icon = createBusMarkerIcon({ routeName: '152', color: '#0d3' });
    const arrow = parseContent(icon.content as string).querySelector<HTMLElement>('[data-bus-arrow]');

    expect(arrow).not.toBeNull();
    expect(arrow?.style.visibility).toBe('hidden');
  });

  it('heading 지정 시 그 각도로 회전한 방향 화살표를 보이게 그린다', () => {
    const icon = createBusMarkerIcon({
      routeName: '152',
      color: '#0d3',
      heading: 90,
    });
    const arrow = parseContent(icon.content as string).querySelector<HTMLElement>('[data-bus-arrow]');

    expect(arrow).not.toBeNull();
    expect(arrow?.style.visibility).toBe('visible');
    expect(arrow?.style.transform).toBe('rotate(90deg)');
  });
});
