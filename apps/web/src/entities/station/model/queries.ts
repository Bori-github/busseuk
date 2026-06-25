import { queryOptions } from '@tanstack/react-query';

import { getStationsByName } from '../api/getStationsByName';
import { stationQueryKeys } from './queryKeys';

export const getStationsByNameQueryOptions = (query: string) =>
  queryOptions({
    queryKey: stationQueryKeys.searchByName(query),
    queryFn: () => getStationsByName(query),
    staleTime: 60_000, // 1분
  });
