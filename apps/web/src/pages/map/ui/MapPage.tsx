import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { isSameNearbyQueryPoint, nearbyStopsQueryOptions } from '@entities/bus-stop';
import type { StationSearchResult } from '@entities/station';
import { ArrowRotateRightIcon, SearchIcon } from '@shared/icons';
import { MapHint, PEEK_HEIGHT_RATIO } from '@shared/ui';

/** 검색·마커 공통 정류장 형태. 두 출처의 필드명이 달라 여기서 맞춤 */
interface Location {
  lat: number;
  lng: number;
}

interface SelectedStation {
  stationId: string;
  arsId: string;
  name: string;
  lat: number;
  lng: number;
}

/** 선택 노선 + 고른 정류장. 태그에서 시트를 다시 열 때 사용 */
interface SelectedRouteItem extends SelectedRoute {
  station: SelectedStation;
}

export const MapPage = () => {
  const { location, isLocating, error: locationError } = useUserLocation();

  const [selectedStation, setSelectedStation] = useState<SelectedStation | null>(null);
  const [isStationInformationSheetOpen, setIsStationInformationSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<SelectedRouteItem[]>([]);
  // 버스 마커가 보일 때만 폴링. 공공데이터 호출 쿼터 절약
  const [busesVisible, setBusesVisible] = useState(false);
  // 초기값을 내 위치로 주면 임시 좌표가 그대로 굳음
  const [searchCenter, setSearchCenter] = useState<Location | null>(null);
  const [canSearchHere, setCanSearchHere] = useState(false);
  // 상태로 두면 지도가 멈출 때마다 화면이 다시 그려짐
  const mapCenterRef = useRef<Location | null>(null);

  const selectedRouteIds = selectedRoutes.map((route) => route.busRouteId);

  const queryCenter = searchCenter ?? location;

  const {
    data: nearbyStations = [],
    isError: hasNearbyStationsError,
    isSuccess: hasNearbyStationsLoaded,
  } = useQuery({
    ...nearbyStopsQueryOptions(queryCenter.lat, queryCenter.lng),
    enabled: !isLocating,
  });

  // 실패가 빈 배열로 대체돼 "정류소 없음"과 구분 불가. 토스트로 알림
  useEffect(() => {
    if (hasNearbyStationsError) {
      toast.error('주변 정류소를 불러오지 못했습니다');
    }
  }, [hasNearbyStationsError]);

  // 실패 시 서울 시청으로 폴백. 알리지 않으면 자기 위치로 오해
  useEffect(() => {
    if (locationError) {
      toast.error(locationError);
    }
  }, [locationError]);

  // 조회는 성공했는데 0개인 경우. 실패(토스트)와 구분해 보여줌
  const hasNoNearbyStations = hasNearbyStationsLoaded && nearbyStations.length === 0;

  // 노선은 골랐는데 마커가 안 보이면 "버스 없음"과 구분 불가. 확대를 안내
  const shouldShowBusZoomHint = selectedRoutes.length > 0 && !busesVisible;

  const busPositionQueries = useQueries({
    queries: selectedRoutes.map((route) => busPositionsQueryOptions(route.busRouteId, busesVisible)),
  });

  const routePathQueries = useQueries({
    queries: selectedRoutes.map((route) => routePathQueryOptions(route.busRouteId)),
  });

  // data 참조는 react-query가 고정. 갱신 시각을 재계산 기준으로 사용
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

  // 실패가 빈 배열로 대체돼 "버스 없음"과 구분 불가. 토스트로 알림
  // 폴링은 일시 장애 자동 회복을 위해 유지
  const hasBusDataError = busPositionQueries.some((query) => query.isError) || routePathQueries.some((query) => query.isError);
  useEffect(() => {
    if (hasBusDataError) {
      toast.error('실시간 버스 정보를 불러오지 못했습니다');
    }
  }, [hasBusDataError]);

  // 앱이 옮긴 경우도 좌표는 갱신. 빠뜨리면 보정 패닝 뒤 화면과 다른 지점을 조회
  const handleMapIdle = useCallback(
    (center: Location, movedByUser: boolean) => {
      mapCenterRef.current = center;
      // 확대·축소만으로는 지도 중심이 바뀌지 않으므로 재조회 불필요
      if (movedByUser) setCanSearchHere(!isSameNearbyQueryPoint(center, queryCenter));
    },
    [queryCenter],
  );

  // 재조회만 하고 지도는 움직이지 않음
  // 로딩 여부로 숨기면, 조금만 움직였을 때 요청이 없어 버튼이 사라지지 않음
  const handleSearchHere = () => {
    if (mapCenterRef.current) {
      setSearchCenter(mapCenterRef.current);
    }
    setCanSearchHere(false);
  };

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
      // 추가(체크)는 정류장 시트가 열린 상태에서만 일어나므로 selectedStation이 존재
      if (!selectedStation) return prev;
      return [...prev, { ...route, station: selectedStation }];
    });
  };

  // 태그의 노선명을 누르면 그 노선을 고른 정류장의 도착정보 시트를 다시 엶
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
        onMapIdle={handleMapIdle}
        bottomInset={isStationInformationSheetOpen ? window.innerHeight * PEEK_HEIGHT_RATIO : 0}
      />

      {/* 오버레이가 페이드로 덮으므로(z-20 불투명) 이 블록은 조건부로 숨기지 않음.
          숨기면 페이드 도중 지도가 드러나 레이아웃이 튐 */}
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
        {canSearchHere && (
          <button
            type="button"
            onClick={handleSearchHere}
            className="flex items-center gap-1.5 self-center rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-lg"
          >
            <ArrowRotateRightIcon className="h-4 w-4 shrink-0" />현 지도에서 검색
          </button>
        )}
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
