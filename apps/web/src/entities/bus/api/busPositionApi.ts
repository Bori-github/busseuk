import type { BusPosition } from '../model/types';

import { busGet } from '@shared/api';

export const getBusPositions = (busRouteId: string): Promise<BusPosition[]> =>
  busGet<BusPosition>('/buspos/getBusPosByRtid', { busRouteId });
