import { describe, expect, it, vi } from 'vitest';

import { getNearbyStations } from '../api/getNearbyStations';
import { nearbyStationsQueryOptions } from './queries';

vi.mock('../api/getNearbyStations', () => ({
  getNearbyStations: vi.fn().mockResolvedValue([]),
}));

describe('nearbyStationsQueryOptions', () => {
  it('좌표를 약 11m 격자로 반올림해 질의 키를 만든다', () => {
    const options = nearbyStationsQueryOptions(37.49791234, 127.02764321);

    expect(options.queryKey).toEqual(['station', 'nearby', 37.4979, 127.0276]);
  });

  it('질의 키와 같은 반올림 좌표로 조회한다', async () => {
    const options = nearbyStationsQueryOptions(37.49791234, 127.02764321);

    await options.queryFn?.({} as never);

    expect(getNearbyStations).toHaveBeenCalledWith(37.4979, 127.0276);
  });
});
