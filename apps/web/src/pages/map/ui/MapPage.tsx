import { useState } from 'react';
import { BusMapWidget } from '@widgets/bus-map';
import { SearchOverlay } from '@features/search';
import { StationInformationBottomSheet } from '@features/station-information';
import { useUserLocation } from '@features/user-location';

import type { StationSearchResult } from '@entities/station';
import { SearchIcon } from '@shared/icons';

export const MapPage = () => {
  const { location } = useUserLocation();

  const [selectedStation, setSelectedStation] =
    useState<StationSearchResult | null>(null);
  const [isStationInformationSheetOpen, setIsStationInformationSheetOpen] =
    useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // TODO: 최대 5개 노선 선택 기능 추가
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);

  const handleSelectStation = (station: StationSearchResult) => {
    setSelectedStation(station);
    setSelectedRouteIds([]);
    setIsStationInformationSheetOpen(true);
    setIsSearchOpen(false);
  };

  const handleStationInformationSheetClose = () => {
    setSelectedStation(null);
    setIsStationInformationSheetOpen(false);
    setSelectedRouteIds([]);
  };

  const handleToggleRoute = (busRouteId: string) => {
    setSelectedRouteIds((prev) =>
      prev.includes(busRouteId)
        ? prev.filter((id) => id !== busRouteId)
        : [...prev, busRouteId],
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
      />

      {!isSearchOpen && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
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
