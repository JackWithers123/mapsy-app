
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';
import { Location, Route } from '@/types/maps';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface MapViewProps {
  selectedLocation: Location | null;
  currentLocation: Location | null;
  route: Route | null;
  onCurrentLocationFound: (location: Location) => void;
  onLocationSelect: (location: Location) => void;
}

const MapView: React.FC<MapViewProps> = ({
  selectedLocation,
  currentLocation,
  route,
  onCurrentLocationFound,
  onLocationSelect,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef<any>(null);

  const handleTokenSubmit = (token: string) => {
    setMapboxToken(token);
    setIsTokenDialogOpen(false);
    initializeMap(token);
  };

  const initializeMap = async (token: string) => {
    if (!mapContainer.current) return;

    try {
      // Dynamic import of mapbox-gl
      const mapboxgl = await import('mapbox-gl');
      await import('mapbox-gl/dist/mapbox-gl.css');

      mapboxgl.default.accessToken = token;

      const map = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.5, 40],
        zoom: 9,
      });

      map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');
      mapRef.current = map;

      // Add click handler for selecting locations
      map.on('click', async (e) => {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${token}`
          );
          const data = await response.json();
          
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const location: Location = {
              id: Date.now().toString(),
              name: feature.text || 'Selected Location',
              address: feature.place_name || `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`,
              coordinates,
            };
            onLocationSelect(location);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Error",
        description: "Failed to initialize map. Please check your Mapbox token.",
        variant: "destructive",
      });
    }
  };

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${mapboxToken}`
          );
          const data = await response.json();
          
          const location: Location = {
            id: 'current-location',
            name: 'Current Location',
            address: data.features?.[0]?.place_name || `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`,
            coordinates,
          };

          onCurrentLocationFound(location);
          
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: coordinates,
              zoom: 15,
            });
          }
        } catch (error) {
          console.error('Error getting location details:', error);
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        toast({
          title: "Error",
          description: "Unable to retrieve your location. Please enable location services.",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      }
    );
  };

  // Update map when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: selectedLocation.coordinates,
        zoom: 15,
      });

      // Add marker for selected location
      const marker = document.createElement('div');
      marker.className = 'w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center';
      marker.innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div>';

      new (window as any).mapboxgl.Marker(marker)
        .setLngLat(selectedLocation.coordinates)
        .addTo(mapRef.current);
    }
  }, [selectedLocation]);

  // Update map when currentLocation changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      // Add marker for current location
      const marker = document.createElement('div');
      marker.className = 'w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center';
      marker.innerHTML = '<div class="w-3 h-3 bg-white rounded-full"></div>';

      new (window as any).mapboxgl.Marker(marker)
        .setLngLat(currentLocation.coordinates)
        .addTo(mapRef.current);
    }
  }, [currentLocation]);

  if (isTokenDialogOpen) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <h2 className="text-xl font-bold mb-4">Setup Required</h2>
          <p className="text-gray-600 mb-4">
            To use the maps functionality, please enter your Mapbox public token.
            You can get one from{' '}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <input
            type="text"
            placeholder="Enter your Mapbox token"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement;
                if (target.value.trim()) {
                  handleTokenSubmit(target.value.trim());
                }
              }
            }}
          />
          <Button
            onClick={() => {
              const input = document.querySelector('input') as HTMLInputElement;
              if (input?.value.trim()) {
                handleTokenSubmit(input.value.trim());
              }
            }}
            className="w-full"
          >
            Initialize Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Current Location Button */}
      <Button
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="absolute top-4 right-4 z-10 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-lg"
        size="sm"
      >
        {isLoadingLocation ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        <span className="ml-2">My Location</span>
      </Button>
    </div>
  );
};

export default MapView;
