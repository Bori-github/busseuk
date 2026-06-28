import type { StationInformation } from '../model/types';

import { busGet } from '@shared/api';

export const getStationInformation = (
  arsId: string,
): Promise<StationInformation[]> =>
  busGet<StationInformation>('/stationinfo/getStationByUid', { arsId });
