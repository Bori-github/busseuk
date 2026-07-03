import type { StationSearchResult } from '../model/types';

import { busGet } from '@shared/api';

export const getStationsByName = (name: string): Promise<StationSearchResult[]> =>
  busGet<StationSearchResult>('/stationinfo/getStationByName', {
    stSrch: name,
  });
