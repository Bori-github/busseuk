import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { BusRouteWithPositions } from '@widgets/bus-map';
import { BusMapWidget } from '@widgets/bus-map';
import { SearchOverlay } from '@features/search';
import { BusZoomHint, SelectedRouteTagList } from '@features/selected-routes';
import { StationInformationBottomSheet } from '@features/station-information';
import { useUserLocation } from '@features/user-location';

import type { SelectedRoute } from '@entities/bus';
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
  // 버스 마커가 실제로 보일 때(줌 임계 이상)만 위치를 폴링해 공공데이터 호출을 아낀다.
  const [busesVisible, setBusesVisible] = useState(false);

  const selectedRouteIds = selectedRoutes.map((route) => route.busRouteId);

  // 선택한 노선이 있는데 줌이 낮아 버스 마커가 안 보이면(=버스 없음과 구분 불가) 확대를 안내한다.
  const shouldShowBusZoomHint = selectedRoutes.length > 0 && !busesVisible;

  const busPositionQueries = useQueries({
    queries: selectedRoutes.map((route) =>
      busPositionsQueryOptions(route.busRouteId, busesVisible),
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
        positions: busPositionQueries[index]?.data ?? [],
        path: routePathQueries[index]?.data ?? [],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedRoutes, positionsUpdatedAt, pathsUpdatedAt],
  );

  // 위치/경로 조회 실패는 빈 배열로 대체돼 지도에 조용히 묻히므로(=버스 없음과 구분 불가),
  // 에러 상태로 전환될 때 토스트로 알린다. 폴링은 일시 장애 자동 회복을 위해 유지한다.
  const hasBusDataError =
    busPositionQueries.some((query) => query.isError) ||
    routePathQueries.some((query) => query.isError);
  useEffect(() => {
    if (hasBusDataError) {
      toast.error('실시간 버스 정보를 불러오지 못했습니다');
    }
  }, [hasBusDataError]);

  // 지도용 정류장 객체를 안정 참조로 메모이즈한다.
  // 매 렌더 새 객체로 넘기면 BusMapWidget의 패닝 effect가 폴링 리렌더마다 재실행돼
  // 사용자가 이동시킨 지도를 정류장으로 되돌리는 문제가 생긴다. (지도 센터 이동 정책 참고)
  const selectedStationForMap = useMemo(
    () =>
      selectedStation
        ? {
            lat: parseFloat(selectedStation.tmY),
            lng: parseFloat(selectedStation.tmX),
            name: selectedStation.stNm,
          }
        : null,
    [selectedStation],
  );

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setIsStationInformationSheetOpen(false);
  };

  const handleSelectStation = (station: StationSearchResult) => {
    setSelectedStation(station);
    setIsStationInformationSheetOpen(true);
    setIsSearchOpen(false);
  };

  const handleStationInformationSheetClose = () => {
    setSelectedStation(null);
    setIsStationInformationSheetOpen(false);
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
        selectedStation={selectedStationForMap}
        busRoutes={busRoutes}
        onBusVisibilityChange={setBusesVisible}
        bottomInset={
          isStationInformationSheetOpen
            ? window.innerHeight * PEEK_HEIGHT_RATIO
            : 0
        }
      />

      {!isSearchOpen && (
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
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
          <SelectedRouteTagList
            routes={selectedRoutes}
            onRemove={handleToggleRoute}
          />
          {shouldShowBusZoomHint && <BusZoomHint />}
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
