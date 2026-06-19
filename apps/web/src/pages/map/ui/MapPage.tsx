import { BusMapWidget } from '@widgets/bus-map';
import { useUserLocation } from '@features/user-location';

export const MapPage = () => {
  const { location } = useUserLocation();

  return (
    <div className="relative w-full h-full">
      <BusMapWidget location={location} />
    </div>
  );
};
