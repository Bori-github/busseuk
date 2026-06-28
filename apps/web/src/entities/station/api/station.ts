import type { Station } from '../model/types';

import { busGet } from '@shared/api';

export const getNearbyStations = (
  tmX: string,
  tmY: string,
  radius: string,
): Promise<Station[]> =>
  busGet<Station>('/stationinfo/getStationByPos', { tmX, tmY, radius });
