import { render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MapPage } from './MapPage';

import type { NearbyStation } from '@entities/station';
import { getNearbyStations } from '@entities/station/api/getNearbyStations';
import { createQueryWrapper } from '@shared/test/queryWrapper';

vi.mock('@entities/station/api/getNearbyStations', () => ({
  getNearbyStations: vi.fn(),
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

const station: NearbyStation = {
  stationId: '101900011',
  arsId: '02503',
  name: '시청역',
  lat: 37.566031,
  lng: 126.97701,
  distanceMeters: 84,
};

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

const renderMapPage = () => render(<MapPage />, { wrapper: createQueryWrapper() });

describe('MapPage 주변 정류소', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubGeolocation();
  });

  it('주변에 정류소가 없으면 안내를 띄운다', async () => {
    vi.mocked(getNearbyStations).mockResolvedValue([]);

    renderMapPage();

    expect(await screen.findByText('주변에 정류소가 없습니다')).toBeTruthy();
  });

  it('정류소가 있으면 없음 안내를 띄우지 않는다', async () => {
    vi.mocked(getNearbyStations).mockResolvedValue([station]);

    renderMapPage();

    await waitFor(() => expect(getNearbyStations).toHaveBeenCalled());
    expect(screen.queryByText('주변에 정류소가 없습니다')).toBeNull();
  });

  it('조회에 실패하면 없음 안내 대신 토스트로 알린다', async () => {
    vi.mocked(getNearbyStations).mockRejectedValue(new Error('네트워크 오류'));

    renderMapPage();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('주변 정류소를 불러오지 못했습니다'));
    expect(screen.queryByText('주변에 정류소가 없습니다')).toBeNull();
  });
});
