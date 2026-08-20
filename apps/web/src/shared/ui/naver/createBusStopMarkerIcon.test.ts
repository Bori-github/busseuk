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

const render = (variant: 'selected' | 'default' | 'dot'): HTMLElement => {
  const icon = createBusStopMarkerIcon({ name: '불광역', variant });
  const host = document.createElement('div');
  host.innerHTML = icon.content as string;

  return host.firstElementChild as HTMLElement;
};

const anchorY = (variant: 'selected' | 'default' | 'dot'): number => {
  const icon = createBusStopMarkerIcon({ name: '불광역', variant });

  return (icon.anchor as naver.maps.Point).y;
};

describe('createBusStopMarkerIcon', () => {
  it('주변 정류장은 이름표를 붙이지 않는다', () => {
    expect(render('default').textContent?.trim()).toBe('');
    expect(render('selected').textContent).toContain('불광역');
  });

  it('꼬리는 선택된 정류장에만 붙인다', () => {
    expect(render('default').querySelector(BUS_STOP_PIN_TIP_SELECTOR)).toBeNull();
    expect(render('selected').querySelector(BUS_STOP_PIN_TIP_SELECTOR)).not.toBeNull();
  });

  it('선택된 정류장의 원을 더 크게 그린다', () => {
    const size = (el: HTMLElement) => parseFloat((el.firstElementChild as HTMLElement).style.width);

    expect(size(render('selected'))).toBeGreaterThan(size(render('default')));
  });

  it('주변 정류장은 원 중심이 좌표에 놓인다', () => {
    const circleSize = parseFloat((render('default').firstElementChild as HTMLElement).style.width);

    expect(anchorY('default')).toBe(circleSize / 2);
  });

  it('축소했을 때 쓰는 점은 글리프 없이 원만 그린다', () => {
    expect(render('dot').firstElementChild?.querySelector('svg')).toBeNull();
    expect(render('default').firstElementChild?.querySelector('svg')).not.toBeNull();
  });

  it('점은 기본 마커보다 작다', () => {
    const size = (el: HTMLElement) => parseFloat((el.firstElementChild as HTMLElement).style.width);

    expect(size(render('dot'))).toBeLessThan(size(render('default')));
  });

  it('점도 원 중심이 좌표에 놓인다', () => {
    const circleSize = parseFloat((render('dot').firstElementChild as HTMLElement).style.width);

    expect(anchorY('dot')).toBe(circleSize / 2);
  });

  it('선택된 정류장은 꼬리 끝이 좌표에 놓인다', () => {
    // 원 중심을 앵커로 쓰면 핀이 좌표 위로 떠 정류장을 가리키지 못함
    const circleSize = parseFloat((render('selected').firstElementChild as HTMLElement).style.width);

    expect(anchorY('selected')).toBeGreaterThan(circleSize);
  });
});
