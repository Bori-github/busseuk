import { ENV } from '@shared/config';

let sdkPromise: Promise<void> | null = null;

export const loadKakaoMapSDK = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');

    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${ENV.KAKAO_MAP_API_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error('카카오맵 SDK 로드 실패'));

    document.head.appendChild(script);
  });

  return sdkPromise;
};
