import { useCallback, useEffect, useRef, useState } from 'react';

import { createBusStopMarkerIcon, createUserMarkerIcon, NaverMap } from '@shared/ui/naver';

interface Location {
  lat: number;
  lng: number;
}

interface SelectedStation {
  lat: number;
  lng: number;
  name: string;
}

interface BusMapWidgetProps {
  location: Location;
  selectedStation?: SelectedStation | null;
  /** 하단 오버레이(바텀시트 등)가 가리는 높이(px). 선택 정류장을 가려지지 않은 영역 중앙에 배치하기 위해 사용 */
  bottomInset?: number;
}

export const BusMapWidget = ({
  location,
  selectedStation,
  bottomInset = 0,
}: BusMapWidgetProps) => {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const userMarkerRef = useRef<naver.maps.Marker | null>(null);
  const selectedMarkerRef = useRef<naver.maps.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);

  const bottomInsetRef = useRef(bottomInset);
  useEffect(() => {
    bottomInsetRef.current = bottomInset;
  }, [bottomInset]);

  const handleMapReady = useCallback((map: naver.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  // 개발 환경에서 콘솔로 지도 인스턴스에 접근하기 위한 디버그용 코드
  useEffect(() => {
    if (!import.meta.env.DEV || !mapRef.current) return;

    const debugWindow = window as Window & { __busMap?: naver.maps.Map };
    debugWindow.__busMap = mapRef.current;

    return () => {
      delete debugWindow.__busMap;
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new naver.maps.Marker({
        map: mapRef.current,
        position: new naver.maps.LatLng(location.lat, location.lng),
        icon: createUserMarkerIcon(),
      });
    } else {
      userMarkerRef.current.setPosition(
        new naver.maps.LatLng(location.lat, location.lng),
      );
    }
  }, [mapReady, location]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (!selectedStation) {
      selectedMarkerRef.current?.setMap(null);
      selectedMarkerRef.current = null;
      return;
    }

    const position = new naver.maps.LatLng(selectedStation.lat, selectedStation.lng);
    const icon = createBusStopMarkerIcon({ name: selectedStation.name });

    if (!selectedMarkerRef.current) {
      selectedMarkerRef.current = new naver.maps.Marker({
        map: mapRef.current,
        position,
        icon,
      });
    } else {
      selectedMarkerRef.current.setPosition(position);
      selectedMarkerRef.current.setIcon(icon);
      selectedMarkerRef.current.setMap(mapRef.current);
    }

    const inset = bottomInsetRef.current;
    if (inset > 0) {
      // 바텀시트가 하단을 가리므로, 가려지지 않은 영역의 중앙에 정류장이 오도록
      // 화면 투영 좌표에서 목표 중심을 아래로 inset/2만큼 밀어 보정한다.
      const projection = mapRef.current.getProjection();
      const offset = projection.fromCoordToOffset(position);
      const target = projection.fromOffsetToCoord(
        new naver.maps.Point(offset.x, offset.y + inset / 2),
      );
      mapRef.current.panTo(target);
    } else {
      mapRef.current.panTo(position);
    }
  }, [mapReady, selectedStation]);

  return <NaverMap center={location} onReady={handleMapReady} />;
};
