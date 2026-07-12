import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { BottomSheet } from './index';

// jsdom에는 Pointer Capture API가 없다. 드래그 로직 자체와 무관하므로 no-op으로 채운다.
beforeAll(() => {
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.setPointerCapture ??= vi.fn();
  proto.releasePointerCapture ??= vi.fn();
  proto.hasPointerCapture ??= vi.fn(() => false);
});

const PointerEventCtor = (window as unknown as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? window.MouseEvent;

/** timeStamp는 읽기 전용이라 생성 후 덮어써서 '가상의 시각'을 만든다. */
const firePointer = (el: Element, type: string, clientY: number, timeStamp: number) => {
  const event = new PointerEventCtor(type, {
    bubbles: true,
    cancelable: true,
    clientY,
    // @ts-expect-error MouseEvent 폴백에는 pointerId가 없다(런타임에서 무시됨).
    pointerId: 1,
    isPrimary: true,
  });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  fireEvent(el, event);
};

const renderSheet = () => {
  render(
    <BottomSheet open onOpenChange={vi.fn()} onClose={vi.fn()}>
      <BottomSheet.Header>
        <BottomSheet.Title>제목</BottomSheet.Title>
      </BottomSheet.Header>
      <BottomSheet.Content>본문</BottomSheet.Content>
    </BottomSheet>,
  );

  const sheet = screen.getByRole('dialog', { hidden: true });
  const handle = sheet.querySelector('.cursor-grab');
  if (!handle) throw new Error('드래그 핸들을 찾지 못했다');

  return { sheet, handle };
};

const heightOf = (sheet: HTMLElement) => sheet.style.height;

const PEEK = `${window.innerHeight * 0.5}px`;
const FULL = `${window.innerHeight}px`;

describe('BottomSheet 드래그 판정', () => {
  it('짧지만 빠른 플릭(임계값 미만)은 속도가 반영돼 full로 넘어간다', () => {
    const { sheet, handle } = renderSheet();

    // 60px(임계값 80 미만)을 24ms 만에 위로 튕긴다.
    act(() => {
      firePointer(handle, 'pointerdown', 500, 1000);
      firePointer(handle, 'pointermove', 480, 1008);
      firePointer(handle, 'pointermove', 460, 1016);
      firePointer(handle, 'pointermove', 440, 1024);
      firePointer(handle, 'pointerup', 440, 1024);
    });

    expect(heightOf(sheet)).toBe(FULL);
  });

  it('같은 거리를 천천히 끌면(속도 없음) 되돌아온다', () => {
    const { sheet, handle } = renderSheet();

    // 60px을 600ms에 걸쳐 위로. 거리·속도 모두 부족하다.
    act(() => {
      firePointer(handle, 'pointerdown', 500, 1000);
      firePointer(handle, 'pointermove', 480, 1200);
      firePointer(handle, 'pointermove', 460, 1400);
      firePointer(handle, 'pointermove', 440, 1600);
      firePointer(handle, 'pointerup', 440, 1600);
    });

    expect(heightOf(sheet)).toBe(PEEK);
  });

  it('빠르게 끈 뒤 손가락을 멈췄다가 떼면, 낡은 속도가 반영되지 않는다', () => {
    const { sheet, handle } = renderSheet();

    // 60px을 24ms 만에 빠르게 끌고 →
    // 그 자리에서 500ms 정지(정지 중엔 pointermove가 발생하지 않는다) → 그대로 뗀다.
    // 사용자의 의도는 "여기 두겠다"이므로 peek으로 되돌아와야 한다.
    act(() => {
      firePointer(handle, 'pointerdown', 500, 1000);
      firePointer(handle, 'pointermove', 480, 1008);
      firePointer(handle, 'pointermove', 460, 1016);
      firePointer(handle, 'pointermove', 440, 1024);
      firePointer(handle, 'pointerup', 440, 1524);
    });

    expect(heightOf(sheet)).toBe(PEEK);
  });
});
