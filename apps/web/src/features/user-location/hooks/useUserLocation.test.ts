import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUserLocation } from './useUserLocation';

const MOCK_POSITION = {
  coords: {
    latitude: 37.1234,
    longitude: 127.5678,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
} as GeolocationPosition;

const makeError = (code: number): GeolocationPositionError =>
  ({
    code,
    message: '',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  }) as GeolocationPositionError;

// jsdom은 GeolocationPositionError를 제공하지 않으므로 전역에 주입
if (!globalThis.GeolocationPositionError) {
  globalThis.GeolocationPositionError = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as unknown as typeof GeolocationPositionError;
}

describe('useUserLocation', () => {
  let getCurrentPosition: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition },
      writable: true,
      configurable: true,
    });
  });

  it('초기 상태: 서울시청 좌표, isLocating: true, error: null', () => {
    getCurrentPosition.mockImplementation(() => {});

    const { result } = renderHook(() => useUserLocation());

    expect(result.current.location).toEqual({
      lat: 37.5662952,
      lng: 126.9779451,
    });
    expect(result.current.isLocating).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('위치 획득 성공: 실제 좌표로 갱신', async () => {
    getCurrentPosition.mockImplementation((success: PositionCallback) => success(MOCK_POSITION));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.isLocating).toBe(false));

    expect(result.current.location).toEqual({ lat: 37.1234, lng: 127.5678 });
    expect(result.current.error).toBeNull();
  });

  it('권한 거부: PERMISSION_DENIED 메시지 반환', async () => {
    getCurrentPosition.mockImplementation((_: PositionCallback, error: PositionErrorCallback) => error(makeError(1)));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.isLocating).toBe(false));

    expect(result.current.error).toContain('위치 권한이 거부되었습니다');
    expect(result.current.location).toEqual({
      lat: 37.5662952,
      lng: 126.9779451,
    });
  });

  it('타임아웃: 재시도 성공 시 실제 좌표로 갱신', async () => {
    getCurrentPosition
      .mockImplementationOnce((_: PositionCallback, error: PositionErrorCallback) => error(makeError(3)))
      .mockImplementationOnce((success: PositionCallback) => success(MOCK_POSITION));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.isLocating).toBe(false));

    expect(result.current.location).toEqual({ lat: 37.1234, lng: 127.5678 });
    expect(result.current.error).toBeNull();
  });

  it('타임아웃: 재시도 실패 시 TIMEOUT 메시지 반환', async () => {
    getCurrentPosition
      .mockImplementationOnce((_: PositionCallback, error: PositionErrorCallback) => error(makeError(3)))
      .mockImplementationOnce((_: PositionCallback, error: PositionErrorCallback) => error(makeError(3)));

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.isLocating).toBe(false));

    expect(result.current.error).toContain('현재 위치를 가져오지 못했습니다');
  });

  it('Geolocation 미지원: NOT_SUPPORTED 메시지 반환', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => expect(result.current.isLocating).toBe(false));

    expect(result.current.error).toBe('이 브라우저는 위치 정보를 지원하지 않습니다.');
  });
});
