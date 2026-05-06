import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useUserLocation } from '@features/user-location';
import { KakaoMap } from '@shared/ui/kakao';

export const BusMapWidget = () => {
  const { location, error } = useUserLocation();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const mapRef = useRef<kakao.maps.Map | null>(null);
  const userMarkerRef = useRef<kakao.maps.Marker | null>(null);

  const [mapReady, setMapReady] = useState(false);

  const handleMapReady = useCallback((map: kakao.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.kakao.maps.Marker({
        map: mapRef.current,
        position: new window.kakao.maps.LatLng(location.lat, location.lng),
        title: '내 위치',
      });
    } else {
      userMarkerRef.current.setPosition(
        new window.kakao.maps.LatLng(location.lat, location.lng),
      );
    }
  }, [mapReady, location]);

  return <KakaoMap center={location} onReady={handleMapReady} />;
};
