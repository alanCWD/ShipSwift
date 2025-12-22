import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface Address {
  street?: string;
  city?: string;
  province?: string;
  state?: string;
  postalCode?: string;
  zipCode?: string;
  country?: string;
}

interface ShipmentMapProps {
  fromAddress: Address | string;
  toAddress: Address | string;
  status: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export default function ShipmentMap({ fromAddress, toAddress, status }: ShipmentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const parseAddress = (address: Address | string): Address => {
    if (typeof address === 'string') {
      try {
        return JSON.parse(address);
      } catch {
        return {};
      }
    }
    return address || {};
  };

  const formatAddressForGeocoding = (address: Address): string => {
    const parts = [
      address.street,
      address.city,
      address.province || address.state,
      address.postalCode || address.zipCode,
      address.country || 'Canada'
    ].filter(Boolean);
    return parts.join(', ');
  };

  useEffect(() => {
    let isMounted = true;

    const loadGoogleMaps = async () => {
      if (window.google?.maps) {
        initMap();
        return;
      }

      try {
        const response = await fetch('/api/config/maps-key');
        const data = await response.json();
        
        if (!data.apiKey) {
          setError('Map configuration not available');
          setIsLoading(false);
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (isMounted) {
            initMap();
          }
        };
        
        script.onerror = () => {
          if (isMounted) {
            setError('Failed to load map');
            setIsLoading(false);
          }
        };

        document.head.appendChild(script);
      } catch (err) {
        if (isMounted) {
          setError('Failed to load map configuration');
          setIsLoading(false);
        }
      }
    };

    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      const from = parseAddress(fromAddress);
      const to = parseAddress(toAddress);
      
      const fromStr = formatAddressForGeocoding(from);
      const toStr = formatAddressForGeocoding(to);

      const geocoder = new window.google.maps.Geocoder();
      
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 5,
        center: { lat: 49.2827, lng: -123.1207 },
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      let originMarker: any = null;
      let destinationMarker: any = null;
      const bounds = new window.google.maps.LatLngBounds();

      geocoder.geocode({ address: fromStr }, (results: any, geocodeStatus: any) => {
        if (geocodeStatus === 'OK' && results[0]) {
          const originPos = results[0].geometry.location;
          bounds.extend(originPos);

          originMarker = new window.google.maps.Marker({
            position: originPos,
            map,
            title: 'Origin',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#1D4ED8',
              strokeWeight: 2,
            },
          });

          new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>Origin</strong><br/>${from.city || 'Pickup Location'}, ${from.province || from.state || ''}</div>`
          }).open(map, originMarker);

          geocoder.geocode({ address: toStr }, (destResults: any, destStatus: any) => {
            if (destStatus === 'OK' && destResults[0]) {
              const destPos = destResults[0].geometry.location;
              bounds.extend(destPos);

              const deliveredIcon = status === 'delivered' ? '#22C55E' : '#EF4444';
              
              destinationMarker = new window.google.maps.Marker({
                position: destPos,
                map,
                title: 'Destination',
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: deliveredIcon,
                  fillOpacity: 1,
                  strokeColor: status === 'delivered' ? '#16A34A' : '#DC2626',
                  strokeWeight: 2,
                },
              });

              const directionsService = new window.google.maps.DirectionsService();
              const directionsRenderer = new window.google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#3B82F6',
                  strokeWeight: 4,
                  strokeOpacity: 0.7,
                }
              });

              directionsService.route({
                origin: originPos,
                destination: destPos,
                travelMode: window.google.maps.TravelMode.DRIVING,
              }, (result: any, routeStatus: any) => {
                if (routeStatus === 'OK') {
                  directionsRenderer.setDirections(result);
                  
                  if (['shipped', 'in_transit'].includes(status)) {
                    const route = result.routes[0];
                    const path = route.overview_path;
                    const midIndex = Math.floor(path.length * 0.6);
                    const currentPos = path[midIndex];

                    new window.google.maps.Marker({
                      position: currentPos,
                      map,
                      title: 'Current Location',
                      icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: '#F59E0B',
                        fillOpacity: 1,
                        strokeColor: '#D97706',
                        strokeWeight: 2,
                        rotation: window.google.maps.geometry.spherical.computeHeading(currentPos, destPos),
                      },
                      zIndex: 1000,
                    });
                  }
                }

                map.fitBounds(bounds, { padding: 50 });
                setIsLoading(false);
              });
            } else {
              map.fitBounds(bounds, { padding: 50 });
              setIsLoading(false);
            }
          });
        } else {
          setError('Could not locate addresses on map');
          setIsLoading(false);
        }
      });
    };

    loadGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, [fromAddress, toAddress, status]);

  const from = parseAddress(fromAddress);
  const to = parseAddress(toAddress);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Navigation className="w-5 h-5 mr-2 text-blue-600" />
          Shipment Route
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <span className="text-sm text-gray-600">Loading map...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
              <div className="text-center p-4">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">{error}</p>
              </div>
            </div>
          )}

          <div 
            ref={mapRef} 
            className="w-full h-[300px] rounded-lg"
            data-testid="shipment-map"
          />
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
            <span className="text-gray-600">Origin: {from.city || 'Pickup'}, {from.province || from.state || ''}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${status === 'delivered' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-600">Destination: {to.city || 'Delivery'}, {to.province || to.state || ''}</span>
          </div>
        </div>

        {['shipped', 'in_transit'].includes(status) && (
          <div className="flex items-center justify-center mt-2 text-sm text-amber-600">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-amber-500 mr-2" />
            Package in transit
          </div>
        )}
      </CardContent>
    </Card>
  );
}
