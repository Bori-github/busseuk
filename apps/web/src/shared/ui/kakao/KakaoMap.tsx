import { useEffect, useRef } from 'react';

import { loadKakaoMapSDK } from '@shared/lib';

interface KakaoMapProps {
  /** 지도 중심 좌표. 변경 시 panTo로 이동 */
  center: { lat: number; lng: number };
  /** 지도 줌 레벨 (1~14, 작을수록 확대). 기본값: 3 */
  level?: number;
  /** 지도 인스턴스 생성 완료 시 호출되는 콜백 */
  onReady?: (map: kakao.maps.Map) => void;
  /** 지도 컨테이너 className. 기본값: 'w-full h-full' */
  className?: string;
}

export const KakaoMap = ({
  center,
  level = 3,
  onReady,
  className = 'w-full h-full',
}: KakaoMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const centerRef = useRef(center);

  // center의 최신값을 ref에 동기화 — 초기화 클로저가 stale한 값을 읽지 않도록 함
  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  // 마운트 시 1회: SDK 로드 완료 후 지도 인스턴스 생성
  useEffect(() => {
    loadKakaoMapSDK().then(() => {
      if (!containerRef.current || mapRef.current) return;

      const latest = centerRef.current;
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(latest.lat, latest.lng),
        level,
      });

      mapRef.current = map;
      map.panTo(new window.kakao.maps.LatLng(latest.lat, latest.lng));
      onReady?.(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // center prop이 바뀔 때마다 지도 중심 이동
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center.lat, center.lng]);

  return <div ref={containerRef} className={className} />;
};
