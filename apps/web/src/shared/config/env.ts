const get = (key: string): string => {
  const value = import.meta.env[key];

  if (!value) throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);

  return value;
};

export const ENV = {
  KAKAO_MAP_API_KEY: get('VITE_KAKAO_MAP_API_KEY'),
  BUS_API_SERVICE_KEY: get('VITE_BUS_API_SERVICE_KEY'),
} as const;
