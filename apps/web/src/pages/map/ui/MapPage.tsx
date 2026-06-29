import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { BusRouteWithPositions } from '@widgets/bus-map';
import { BusMapWidget } from '@widgets/bus-map';
import { SearchOverlay } from '@features/search';
import type { SelectedRoute } from '@features/station-information';
import { StationInformationBottomSheet } from '@features/station-information';
import { useUserLocation } from '@features/user-location';

import { busPositionsQueryOptions, routePathQueryOptions } from '@entities/bus';
import type { StationSearchResult } from '@entities/station';
import { SearchIcon } from '@shared/icons';
import { PEEK_HEIGHT_RATIO } from '@shared/ui';

export const MapPage = () => {
  const { location } = useUserLocation();

  const [selectedStation, setSelectedStation] =
    useState<StationSearchResult | null>(null);
  const [isStationInformationSheetOpen, setIsStationInformationSheetOpen] =
    useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<SelectedRoute[]>([]);

  const selectedRouteIds = selectedRoutes.map((route) => route.busRouteId);

  const busPositionQueries = useQueries({
    queries: selectedRoutes.map((route) =>
      busPositionsQueryOptions(route.busRouteId),
    ),
  });

  const routePathQueries = useQueries({
    queries: selectedRoutes.map((route) =>
      routePathQueryOptions(route.busRouteId),
    ),
  });

  // data는 react-query가 참조 안정성을 보장하므로, 갱신 시각으로 재계산 시점을 잡는다.
  const positionsUpdatedAt = busPositionQueries
    .map((query) => query.dataUpdatedAt)
    .join(',');
  const pathsUpdatedAt = routePathQueries
    .map((query) => query.dataUpdatedAt)
    .join(',');

  const busRoutes = useMemo<BusRouteWithPositions[]>(
    () =>
      selectedRoutes.map((route, index) => ({
        busRouteId: route.busRouteId,
        routeName: route.busRouteAbrv,
        routeType: route.routeType,
        direction: route.adirection,
        positions: busPositionQueries[index]?.data ?? [],
        path: routePathQueries[index]?.data ?? [],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRoutes, positionsUpdatedAt, pathsUpdatedAt],
  );

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setIsStationInformationSheetOpen(false);
  };

  const handleSelectStation = (station: StationSearchResult) => {
    setSelectedStation(station);
    setSelectedRoutes([]);
    setIsStationInformationSheetOpen(true);
    setIsSearchOpen(false);
  };

  const handleStationInformationSheetClose = () => {
    setSelectedStation(null);
    setIsStationInformationSheetOpen(false);
    setSelectedRoutes([]);
  };

  const handleToggleRoute = (route: SelectedRoute) => {
    setSelectedRoutes((prev) =>
      prev.some((selected) => selected.busRouteId === route.busRouteId)
        ? prev.filter((selected) => selected.busRouteId !== route.busRouteId)
        : [...prev, route],
    );
  };

  return (
    <div className="relative w-full h-full">
      <BusMapWidget
        location={location}
        selectedStation={
          selectedStation
            ? {
                lat: parseFloat(selectedStation.tmY),
                lng: parseFloat(selectedStation.tmX),
                name: selectedStation.stNm,
              }
            : null
        }
        busRoutes={busRoutes}
        bottomInset={
          isStationInformationSheetOpen
            ? window.innerHeight * PEEK_HEIGHT_RATIO
            : 0
        }
      />

      {!isSearchOpen && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="flex items-center gap-2 w-full rounded-full bg-black h-[40px] px-3 py-2 shadow-md"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span
              className={`flex-1 text-sm text-left ${selectedStation ? 'text-white' : 'text-gray-400'}`}
            >
              {selectedStation ? selectedStation.stNm : '정류소 검색'}
            </span>
          </button>
        </div>
      )}

      {isSearchOpen && (
        <SearchOverlay
          onClose={() => setIsSearchOpen(false)}
          onSelect={handleSelectStation}
        />
      )}

      <StationInformationBottomSheet
        open={isStationInformationSheetOpen}
        onOpenChange={setIsStationInformationSheetOpen}
        onClose={handleStationInformationSheetClose}
        arsId={selectedStation?.arsId ?? ''}
        stationName={selectedStation?.stNm ?? ''}
        selectedRouteIds={selectedRouteIds}
        onToggleRoute={handleToggleRoute}
      />
    </div>
  );
};
