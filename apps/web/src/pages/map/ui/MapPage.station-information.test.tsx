import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MapPage } from './MapPage';

import type { StationSearchResult } from '@entities/station';
import { mockStationInformation as mockRoute } from '@entities/station/model/fixtures';
import { getStationInformation } from '@entities/station/api/getStationInformation';
import { createQueryWrapper } from '@shared/test/queryWrapper';

vi.mock('@entities/station/api/getStationInformation', () => ({
  getStationInformation: vi.fn(),
}));

vi.mock('@widgets/bus-map', () => ({
  BusMapWidget: () => null,
}));

vi.mock('@features/search', () => ({
  SearchOverlay: ({
    onSelect,
  }: {
    onSelect: (station: StationSearchResult) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSelect(STATION_A)}>
        select-station-a
      </button>
      <button type="button" onClick={() => onSelect(STATION_B)}>
        select-station-b
      </button>
    </div>
  ),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

const STATION_A: StationSearchResult = {
  stId: '101000001',
  stNm: 'A 정류장',
  arsId: '11111',
  tmX: '126.9779451',
  tmY: '37.5662952',
};

const STATION_B: StationSearchResult = {
  stId: '101000002',
  stNm: 'B 정류장',
  arsId: '22222',
  tmX: '126.9789451',
  tmY: '37.5672952',
};

const renderMapPage = () =>
  render(<MapPage />, { wrapper: createQueryWrapper() });

describe('MapPage station information', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) =>
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
            timestamp: Date.now(),
          } as GeolocationPosition),
      },
      writable: true,
      configurable: true,
    });
  });

  it('정류장 A→B 전환 시 checkbox 선택 상태를 초기화한다', async () => {
    vi.mocked(getStationInformation).mockImplementation(async (arsId) => {
      if (arsId === STATION_A.arsId) {
        return [mockRoute({ busRouteId: 'route-a', busRouteAbrv: '753' })];
      }
      if (arsId === STATION_B.arsId) {
        return [mockRoute({ busRouteId: 'route-b', busRouteAbrv: '7211' })];
      }
      return [];
    });

    renderMapPage();

    await act(async () => {
      screen.getByRole('button', { name: /정류소 검색/ }).click();
    });
    await act(async () => {
      screen.getByRole('button', { name: 'select-station-a' }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('753')).toBeTruthy();
    });

    const checkboxA = screen.getByRole('checkbox');
    await act(async () => {
      checkboxA.click();
    });
    expect(checkboxA).toHaveProperty('checked', true);

    await act(async () => {
      screen.getByRole('button', { name: /A 정류장/ }).click();
    });
    await act(async () => {
      screen.getByRole('button', { name: 'select-station-b' }).click();
    });

    await waitFor(() => {
      expect(screen.getByText('7211')).toBeTruthy();
    });

    const checkboxB = screen.getByRole('checkbox');
    expect(checkboxB).toHaveProperty('checked', false);
  });
});
