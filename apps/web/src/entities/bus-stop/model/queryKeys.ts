export const busStopQueryKeys = {
  all: ['bus-stop'] as const,
  nearby: (lat: number, lng: number) => [...busStopQueryKeys.all, 'nearby', lat, lng] as const,
};
