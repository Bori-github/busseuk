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
}

export const BusMapWidget = ({ location, selectedStation }: BusMapWidgetProps) => {
  const mapRef = useRef<naver.maps.Map | null>(null);
  const userMarkerRef = useRef<naver.maps.Marker | null>(null);
  const selectedMarkerRef = useRef<naver.maps.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);

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

    mapRef.current.panTo(position);
  }, [mapReady, selectedStation]);

  return <NaverMap center={location} onReady={handleMapReady} />;
};
