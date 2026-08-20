import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MapPage } from './MapPage';

import { getNearbyStops } from '@entities/bus-stop/api/getNearbyStops';
import { createQueryWrapper } from '@shared/test/queryWrapper';

vi.mock('@entities/bus-stop/api/getNearbyStops', () => ({
  getNearbyStops: vi.fn(),
  NEARBY_RADIUS_METERS: 300,
}));

vi.mock('@entities/station/api/getStationInformation', () => ({
  getStationInformation: vi.fn().mockResolvedValue([]),
}));

vi.mock('@entities/bus/api/busPositionApi', () => ({
  getBusPositions: vi.fn().mockResolvedValue([]),
}));

vi.mock('@entities/bus/api/busRouteApi', () => ({
  getRoutePath: vi.fn().mockResolvedValue([]),
  searchBusRoutes: vi.fn().mockResolvedValue([]),
}));

vi.mock('@widgets/bus-map', () => ({
  BusMapWidget: () => null,
}));

vi.mock('@features/search', () => ({
  SearchOverlay: () => null,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

/** 위치를 즉시 확정. 넘기지 않으면 isLocating이 true로 남음 */
const stubGeolocation = (resolve = true) => {
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: (success: PositionCallback) => {
        if (!resolve) return;
        success({
          coords: {
            latitude: 37.5662952,
            longitude: 126.9779451,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: 0,
        } as GeolocationPosition);
      },
    },
    writable: true,
    configurable: true,
  });
};

// jsdom은 GeolocationPositionError를 제공하지 않으므로 전역에 주입
if (!globalThis.GeolocationPositionError) {
  globalThis.GeolocationPositionError = {
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  } as unknown as typeof GeolocationPositionError;
}

const renderMapPage = () => render(<MapPage />, { wrapper: createQueryWrapper() });

describe('MapPage 위치 상태', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubGeolocation();
    vi.mocked(getNearbyStops).mockResolvedValue([]);
  });

  it('위치를 확인하는 동안 안내를 띄운다', () => {
    stubGeolocation(false);

    renderMapPage();

    expect(screen.getByText('현재 위치를 확인하는 중입니다')).toBeTruthy();
    expect(getNearbyStops).not.toHaveBeenCalled();
  });

  it('위치를 못 가져오면 폴백 기준을 알린다', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_: PositionCallback, fail?: PositionErrorCallback) =>
          fail?.({ code: 1, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError),
      },
      writable: true,
      configurable: true,
    });

    renderMapPage();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('서울 시청')));
  });
});
