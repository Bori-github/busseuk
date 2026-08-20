import { useEffect, useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import type { BusRouteWithPositions } from '@widgets/bus-map';
import { BusMapWidget } from '@widgets/bus-map';
import { SearchOverlay } from '@features/search';
import { BusZoomHint, SelectedRouteTagList } from '@features/selected-routes';
import { StationInformationBottomSheet } from '@features/station-information';
import { useUserLocation } from '@features/user-location';

import type { SelectedRoute } from '@entities/bus';
import { busPositionsQueryOptions, routePathQueryOptions } from '@entities/bus';
import type { BusStop } from '@entities/bus-stop';
import { nearbyStopsQueryOptions } from '@entities/bus-stop';
import type { StationSearchResult } from '@entities/station';
import { SearchIcon } from '@shared/icons';
import { MapHint, PEEK_HEIGHT_RATIO } from '@shared/ui';

/** 검색 결과와 지도 마커가 공통으로 쓰는 정류장 형태. 두 출처의 필드명이 달라 여기서 맞춘다. */
interface SelectedStation {
  stationId: string;
  arsId: string;
  name: string;
  lat: number;
  lng: number;
}

/** 선택 노선 + 그 노선을 고른 정류장. 태그에서 해당 정류장 시트를 다시 열기 위해 함께 저장한다. */
interface SelectedRouteItem extends SelectedRoute {
  station: SelectedStation;
}

export const MapPage = () => {
  const { location, isLocating, error: locationError } = useUserLocation();

  const [selectedStation, setSelectedStation] = useState<SelectedStation | null>(null);
  const [isStationInformationSheetOpen, setIsStationInformationSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<SelectedRouteItem[]>([]);
  // 버스 마커가 실제로 보일 때(줌 임계 이상)만 위치를 폴링해 공공데이터 호출을 아낀다.
  const [busesVisible, setBusesVisible] = useState(false);

  const selectedRouteIds = selectedRoutes.map((route) => route.busRouteId);

  const {
    data: nearbyStations = [],
    isError: hasNearbyStationsError,
    isSuccess: hasNearbyStationsLoaded,
  } = useQuery({
    ...nearbyStopsQueryOptions(location.lat, location.lng),
    enabled: !isLocating,
  });

  // 조회 실패가 빈 배열로 대체돼 "주변에 정류소가 없음"과 구분되지 않으므로 토스트로 알린다.
  useEffect(() => {
    if (hasNearbyStationsError) {
      toast.error('주변 정류소를 불러오지 못했습니다');
    }
  }, [hasNearbyStationsError]);

  // 훅이 서울 시청으로 폴백하므로, 알리지 않으면 사용자가 그 위치를 자기 위치로 오해한다.
  useEffect(() => {
    if (locationError) {
      toast.error(locationError);
    }
  }, [locationError]);

  // 조회는 성공했는데 0개인 경우. 실패(토스트)와 구분해 보여준다.
  const hasNoNearbyStations = hasNearbyStationsLoaded && nearbyStations.length === 0;

  // 선택한 노선이 있는데 줌이 낮아 버스 마커가 안 보이면(=버스 없음과 구분 불가) 확대를 안내한다.
  const shouldShowBusZoomHint = selectedRoutes.length > 0 && !busesVisible;

  const busPositionQueries = useQueries({
    queries: selectedRoutes.map((route) => busPositionsQueryOptions(route.busRouteId, busesVisible)),
  });

  const routePathQueries = useQueries({
    queries: selectedRoutes.map((route) => routePathQueryOptions(route.busRouteId)),
  });

  // data는 react-query가 참조 안정성을 보장하므로, 갱신 시각으로 재계산 시점을 잡는다.
  const positionsUpdatedAt = busPositionQueries.map((query) => query.dataUpdatedAt).join(',');
  const pathsUpdatedAt = routePathQueries.map((query) => query.dataUpdatedAt).join(',');

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
  const hasBusDataError = busPositionQueries.some((query) => query.isError) || routePathQueries.some((query) => query.isError);
  useEffect(() => {
    if (hasBusDataError) {
      toast.error('실시간 버스 정보를 불러오지 못했습니다');
    }
  }, [hasBusDataError]);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setIsStationInformationSheetOpen(false);
  };

  const openStation = (station: SelectedStation) => {
    setSelectedStation(station);
    setIsStationInformationSheetOpen(true);
    setIsSearchOpen(false);
  };

  const handleSelectFromSearch = (station: StationSearchResult) =>
    openStation({
      stationId: station.stId,
      arsId: station.arsId,
      name: station.stNm,
      lat: parseFloat(station.tmY),
      lng: parseFloat(station.tmX),
    });

  const handleSelectFromMarker = (station: BusStop) =>
    openStation({
      stationId: station.stationId,
      arsId: station.arsId,
      name: station.name,
      lat: station.lat,
      lng: station.lng,
    });

  const handleStationInformationSheetClose = () => {
    setSelectedStation(null);
    setIsStationInformationSheetOpen(false);
  };

  const handleToggleRoute = (route: SelectedRoute) => {
    setSelectedRoutes((prev) => {
      if (prev.some((selected) => selected.busRouteId === route.busRouteId)) {
        return prev.filter((selected) => selected.busRouteId !== route.busRouteId);
      }
      // 추가(체크)는 정류장 시트가 열린 상태에서만 일어나므로 selectedStation이 존재한다.
      if (!selectedStation) return prev;
      return [...prev, { ...route, station: selectedStation }];
    });
  };

  // 태그의 노선명을 누르면 그 노선을 고른 정류장의 도착정보 시트를 다시 연다.
  const handleReopenStation = (route: SelectedRoute) => {
    const item = selectedRoutes.find((selected) => selected.busRouteId === route.busRouteId);
    if (!item) return;
    openStation(item.station);
  };

  return (
    <div className="relative w-full h-full">
      <BusMapWidget
        location={location}
        selectedStation={selectedStation}
        busRoutes={busRoutes}
        stations={nearbyStations}
        onStationSelect={handleSelectFromMarker}
        onBusVisibilityChange={setBusesVisible}
        bottomInset={isStationInformationSheetOpen ? window.innerHeight * PEEK_HEIGHT_RATIO : 0}
      />

      {/* 오버레이가 페이드로 덮으므로(z-20 불투명) 이 블록은 조건부로 숨기지 않는다.
          숨기면 페이드 도중 지도가 드러나 레이아웃이 튄다. */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleOpenSearch}
          className="flex items-center gap-2 w-full rounded-full bg-black h-[40px] px-3 py-2 shadow-md"
        >
          <SearchIcon className="h-4 w-4 shrink-0 text-gray-400" />
          <span className={`flex-1 text-sm text-left ${selectedStation ? 'text-white' : 'text-gray-400'}`}>
            {selectedStation ? selectedStation.name : '정류소 검색'}
          </span>
        </button>
        <SelectedRouteTagList routes={selectedRoutes} onRemove={handleToggleRoute} onReopen={handleReopenStation} />
        {isLocating && <MapHint>현재 위치를 확인하는 중입니다</MapHint>}
        {hasNoNearbyStations && <MapHint>주변에 정류소가 없습니다</MapHint>}
        {shouldShowBusZoomHint && <BusZoomHint />}
      </div>

      <AnimatePresence>
        {isSearchOpen && <SearchOverlay key="search-overlay" onClose={() => setIsSearchOpen(false)} onSelect={handleSelectFromSearch} />}
      </AnimatePresence>

      <StationInformationBottomSheet
        open={isStationInformationSheetOpen}
        onOpenChange={setIsStationInformationSheetOpen}
        onClose={handleStationInformationSheetClose}
        arsId={selectedStation?.arsId ?? ''}
        stationName={selectedStation?.name ?? ''}
        selectedRouteIds={selectedRouteIds}
        onToggleRoute={handleToggleRoute}
      />
    </div>
  );
};
