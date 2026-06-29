export const busQueryKeys = {
  all: ['bus'] as const,
  routes: () => [...busQueryKeys.all, 'route'] as const,
  routeSearch: (name: string) =>
    [...busQueryKeys.routes(), 'search', name] as const,
  routePath: (busRouteId: string) =>
    [...busQueryKeys.routes(), 'path', busRouteId] as const,
  positions: () => [...busQueryKeys.all, 'position'] as const,
  position: (busRouteId: string) =>
    [...busQueryKeys.positions(), busRouteId] as const,
};
