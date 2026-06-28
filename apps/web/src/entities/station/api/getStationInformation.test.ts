import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStationInformation } from './getStationInformation';

import { busGet } from '@shared/api';

vi.mock('@shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/api')>();

  return {
    ...actual,
    busGet: vi.fn(),
  };
});

describe('getStationInformation', () => {
  beforeEach(() => {
    vi.mocked(busGet).mockReset();
  });

  it('arsId로 getStationByUid API를 호출한다', async () => {
    vi.mocked(busGet).mockResolvedValue([]);

    await getStationInformation('12121');

    expect(busGet).toHaveBeenCalledWith('/stationinfo/getStationByUid', {
      arsId: '12121',
    });
  });
});
