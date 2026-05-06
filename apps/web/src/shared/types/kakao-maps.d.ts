declare namespace kakao {
  namespace maps {
    function load(callback: () => void): void

    class Map {
      constructor(container: HTMLElement, options: MapOptions)
      setCenter(latlng: LatLng): void
      panTo(latlng: LatLng): void
      getLevel(): number
      setLevel(level: number): void
    }

    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }

    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(latlng: LatLng): void
    }

    class MarkerImage {
      constructor(src: string, size: Size, options?: MarkerImageOptions)
    }

    class Size {
      constructor(width: number, height: number)
    }

    class Point {
      constructor(x: number, y: number)
    }

    interface MapOptions {
      center: LatLng
      level?: number
    }

    interface MarkerOptions {
      map?: Map
      position: LatLng
      image?: MarkerImage
      title?: string
    }

    interface MarkerImageOptions {
      offset?: Point
    }
  }
}

interface Window {
  kakao: typeof kakao
}
