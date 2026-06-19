import { ENV } from '@shared/config';

let sdkPromise: Promise<void> | null = null;

export const loadNaverMapSDK = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const callbackName = '__naverMapInit__';

    window.__naverMapInit__ = () => {
      delete window.__naverMapInit__;
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${ENV.NAVER_MAP_CLIENT_ID}&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('네이버맵 SDK 로드 실패'));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
};
