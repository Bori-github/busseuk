import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBusStopMarkerIcon, BUS_STOP_PIN_TIP_SELECTOR } from './createBusStopMarkerIcon';

// toMeasuredHtmlIcon은 window.naver.maps.Size/Point를 사용하므로 최소 스텁을 둠
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

const render = (selected: boolean): HTMLElement => {
  const icon = createBusStopMarkerIcon({ name: '불광역', selected });
  const host = document.createElement('div');
  host.innerHTML = icon.content as string;

  return host.firstElementChild as HTMLElement;
};

const anchorY = (selected: boolean): number => {
  const icon = createBusStopMarkerIcon({ name: '불광역', selected });

  return (icon.anchor as naver.maps.Point).y;
};

describe('createBusStopMarkerIcon', () => {
  it('주변 정류장은 이름표를 붙이지 않는다', () => {
    expect(render(false).textContent?.trim()).toBe('');
    expect(render(true).textContent).toContain('불광역');
  });

  it('꼬리는 선택된 정류장에만 붙인다', () => {
    expect(render(false).querySelector(BUS_STOP_PIN_TIP_SELECTOR)).toBeNull();
    expect(render(true).querySelector(BUS_STOP_PIN_TIP_SELECTOR)).not.toBeNull();
  });

  it('선택된 정류장의 원을 더 크게 그린다', () => {
    const size = (el: HTMLElement) => parseFloat((el.firstElementChild as HTMLElement).style.width);

    expect(size(render(true))).toBeGreaterThan(size(render(false)));
  });

  it('주변 정류장은 원 중심이 좌표에 놓인다', () => {
    const circleSize = parseFloat((render(false).firstElementChild as HTMLElement).style.width);

    expect(anchorY(false)).toBe(circleSize / 2);
  });

  it('선택된 정류장은 꼬리 끝이 좌표에 놓인다', () => {
    // 원 중심을 앵커로 쓰면 핀이 좌표 위로 떠 정류장을 가리키지 못한다.
    const circleSize = parseFloat((render(true).firstElementChild as HTMLElement).style.width);

    expect(anchorY(true)).toBeGreaterThan(circleSize);
  });
});
