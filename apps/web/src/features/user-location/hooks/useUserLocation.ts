import { useEffect, useState } from 'react';

interface Location {
  lat: number;
  lng: number;
}

const SEOUL_CITY_HALL: Location = { lat: 37.5662952, lng: 126.9779451 };

const DEFAULT_LOCATION: { location: Location; label: string } = {
  location: SEOUL_CITY_HALL,
  label: '서울 시청',
};

const ERROR_MESSAGES = {
  PERMISSION_DENIED: `위치 권한이 거부되었습니다. ${DEFAULT_LOCATION.label}을 기준으로 표시합니다.`,
  TIMEOUT: `현재 위치를 가져오지 못했습니다. ${DEFAULT_LOCATION.label}을 기준으로 표시합니다.`,
  NOT_SUPPORTED: '이 브라우저는 위치 정보를 지원하지 않습니다.',
};

export const useUserLocation = () => {
  const [location, setLocation] = useState<Location>(DEFAULT_LOCATION.location);
  const [isLocating, setIsLocating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      Promise.resolve().then(() => {
        setError(ERROR_MESSAGES.NOT_SUPPORTED);
        setIsLocating(false);
      });
      return;
    }

    const options: PositionOptions = {
      timeout: 10_000, // 10 seconds
      maximumAge: 120_000, // 2 minutes
      enableHighAccuracy: false,
    };

    const applyPosition = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setIsLocating(false);
    };

    const fail = (error?: GeolocationPositionError) => {
      const isDenied = error?.code === GeolocationPositionError.PERMISSION_DENIED;
      setError(isDenied ? ERROR_MESSAGES.PERMISSION_DENIED : ERROR_MESSAGES.TIMEOUT);
      setIsLocating(false);
    };

    navigator.geolocation.getCurrentPosition(
      (position) => applyPosition(position),
      (error) => {
        if (error.code === GeolocationPositionError.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            (position) => applyPosition(position),
            (retryError) => fail(retryError),
            options,
          );
          return;
        }
        fail(error);
      },
      options,
    );
  }, []);

  return { location, isLocating, error };
};
