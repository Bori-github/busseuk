export const stationQueryKeys = {
  all: ['station'] as const,
  searchByName: (name: string) => [...stationQueryKeys.all, 'searchByName', name] as const,
  stationInformation: (arsId: string) => [...stationQueryKeys.all, 'stationInformation', arsId] as const,
  nearby: (lat: number, lng: number) => [...stationQueryKeys.all, 'nearby', lat, lng] as const,
};
