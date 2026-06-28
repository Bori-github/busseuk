import { queryOptions } from '@tanstack/react-query';

import { getStationsByName } from '../api/getStationsByName';
import { getStationInformation } from '../api/getStationInformation';
import { stationQueryKeys } from './queryKeys';

export const getStationsByNameQueryOptions = (query: string) =>
  queryOptions({
    queryKey: stationQueryKeys.searchByName(query),
    queryFn: () => getStationsByName(query),
    staleTime: 60_000, // 1분
  });

export const getStationInformationQueryOptions = (arsId: string) =>
  queryOptions({
    queryKey: stationQueryKeys.stationInformation(arsId),
    queryFn: () => getStationInformation(arsId),
    staleTime: 15_000, // 15초
  });
