import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Loader } from 'lucide-react';
import { Location, Route } from '@/types/maps';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface MapViewProps {
  selectedLocation: Location | null;
  currentLocation: Location | null;
  route: Route | null;
  onCurrentLocationFound: (location: Location) => void;
  onLocationSelect: (location: Location) => void;
  zoomToCoordinates?: [number, number] | null;
}

const MapView: React.FC<MapViewProps> = ({
  selectedLocation,
  currentLocation,
  route,
  onCurrentLocationFound,
  onLocationSelect,
  zoomToCoordinates,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      // Dynamic import of Leaflet
      const L = await import('leaflet');
      
      // Wait for CSS to load properly
      await new Promise<void>((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.onload = () => resolve();
        link.onerror = () => resolve(); // Continue even if CSS fails to load
        document.head.appendChild(link);
        
        // Fallback timeout
        setTimeout(resolve, 1000);
      });

      // Fix default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Small delay to ensure container is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initialize map with a default location (New York City)
      const map = L.map(mapContainer.current, {
        center: [40.7128, -74.0060],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: false
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapLoaded(true);
      console.log('Map initialized successfully');

      // Force map to refresh and resize to fill container
      setTimeout(() => {
        map.invalidateSize();
      }, 100);

      // Add click handler for selecting locations
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        const coordinates: [number, number] = [lng, lat];
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          
          const location: Location = {
            id: Date.now().toString(),
            name: data.display_name?.split(',')[0] || 'Selected Location',
            address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            coordinates,
          };
          onLocationSelect(location);
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          const location: Location = {
            id: Date.now().toString(),
            name: 'Selected Location',
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            coordinates,
          };
          onLocationSelect(location);
        }
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Error",
        description: "Failed to initialize map.",
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
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates[1]}&lon=${coordinates[0]}`
          );
          const data = await response.json();
          
          const location: Location = {
            id: 'current-location',
            name: 'Current Location',
            address: data.display_name || `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`,
            coordinates,
          };

          onCurrentLocationFound(location);
          
          if (mapRef.current) {
            mapRef.current.setView([coordinates[1], coordinates[0]], 15);
          }
        } catch (error) {
          console.error('Error getting location details:', error);
          // Still create location even if reverse geocoding fails
          const location: Location = {
            id: 'current-location',
            name: 'Current Location',
            address: `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`,
            coordinates,
          };
          onCurrentLocationFound(location);
          
          if (mapRef.current) {
            mapRef.current.setView([coordinates[1], coordinates[0]], 15);
          }
        }
        
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        let errorMessage = "Unable to retrieve your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    );
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  // Add effect to handle zooming to specific coordinates
  useEffect(() => {
    if (zoomToCoordinates && mapRef.current) {
      mapRef.current.setView([zoomToCoordinates[1], zoomToCoordinates[0]], 18);
    }
  }, [zoomToCoordinates]);

  // Update map when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      import('leaflet').then(L => {
        clearMarkers();
        
        mapRef.current.setView([selectedLocation.coordinates[1], selectedLocation.coordinates[0]], 15);

        const marker = L.marker([selectedLocation.coordinates[1], selectedLocation.coordinates[0]])
          .addTo(mapRef.current)
          .bindPopup(selectedLocation.name);
        
        markersRef.current.push(marker);
      });
    }
  }, [selectedLocation]);

  // Update map when currentLocation changes
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      import('leaflet').then(L => {
        const marker = L.marker([currentLocation.coordinates[1], currentLocation.coordinates[0]])
          .addTo(mapRef.current)
          .bindPopup('Current Location');
        
        markersRef.current.push(marker);
      });
    }
  }, [currentLocation]);

  // Draw route when route changes
  useEffect(() => {
    if (route && mapRef.current) {
      import('leaflet').then(L => {
        // Convert coordinates to Leaflet format [lat, lng]
        const routeCoords = route.geometry.map(coord => [coord[1], coord[0]] as [number, number]);
        
        const polyline = L.polyline(routeCoords, { color: 'blue', weight: 4 })
          .addTo(mapRef.current);
        
        markersRef.current.push(polyline);
        
        // Fit map to route
        mapRef.current.fitBounds(polyline.getBounds());
      });
    }
  }, [route]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full bg-gray-100"
      />
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-600" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Current Location Button */}
      <Button
        onClick={getCurrentLocation}
        disabled={isLoadingLocation}
        className="absolute top-4 right-4 z-20 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-lg"
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
