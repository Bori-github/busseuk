import { useEffect, useRef } from 'react';

import { loadNaverMapSDK } from '@shared/lib';

const NAVER_CUSTOM_STYLE_ID = '59272e0e-36d1-4a0e-a14a-122cf10d64b0';

interface NaverMapProps {
  /** 지도 중심 좌표. 변경 시 panTo로 이동 */
  center: { lat: number; lng: number };
  /** 네이버 줌 레벨 (최대 21, 클수록 확대). 기본값: 16 */
  zoom?: number;
  /** 지도 인스턴스 생성 완료 시 호출되는 콜백 */
  onReady?: (map: naver.maps.Map) => void;
  /** 줌 레벨 변경 시 호출되는 콜백. 생성 직후 초기 줌으로 1회 호출 */
  onZoomChanged?: (zoom: number) => void;
  /** 지도 컨테이너 className. 기본값: 'w-full h-full' */
  className?: string;
}

export const NaverMap = ({
  center,
  zoom = 17, // 버스 정류장 아이콘 노출 최소 줌 레벨
  onReady,
  onZoomChanged,
  className = 'w-full h-full',
}: NaverMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const centerRef = useRef(center);
  const onZoomChangedRef = useRef(onZoomChanged);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    onZoomChangedRef.current = onZoomChanged;
  }, [onZoomChanged]);

  useEffect(() => {
    loadNaverMapSDK().then(() => {
      if (!containerRef.current || mapRef.current) return;

      const latest = centerRef.current;
      const map = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(latest.lat, latest.lng),
        zoom,
        minZoom: 7,
        mapTypes: new naver.maps.MapTypeRegistry({
          normal: naver.maps.NaverStyleMapTypeOptions.getNormalMap({
            overlayType: 'bg.ol.ts.lko',
          }),
        }),
        gl: true,
        customStyleId: NAVER_CUSTOM_STYLE_ID,
      });

      mapRef.current = map;
      onReady?.(map);

      onZoomChangedRef.current?.(map.getZoom());
      naver.maps.Event.addListener(map, 'zoom_changed', (level: number) => {
        onZoomChangedRef.current?.(level);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.panTo(new naver.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng]);

  return <div ref={containerRef} className={className} />;
};
