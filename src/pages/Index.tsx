import React, { useState } from 'react';
import MapView from '@/components/MapView';
import SearchPanel from '@/components/SearchPanel';
import DirectionsPanel from '@/components/DirectionsPanel';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Location, Route } from '@/types/maps';

const Index = () => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [isDirectionsMode, setIsDirectionsMode] = useState(false);
  const [destination, setDestination] = useState<Location | null>(null);
  const [zoomToCoordinates, setZoomToCoordinates] = useState<[number, number] | null>(null);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    if (isDirectionsMode && currentLocation) {
      setDestination(location);
    }
  };

  const handleCurrentLocationFound = (location: Location) => {
    setCurrentLocation(location);
  };

  const handleDirectionsToggle = () => {
    setIsDirectionsMode(!isDirectionsMode);
    setRoute(null);
    setDestination(null);
  };

  const handleRouteCalculated = (calculatedRoute: Route) => {
    setRoute(calculatedRoute);
  };

  const handleStepClick = (coordinates: [number, number]) => {
    setZoomToCoordinates(coordinates);
    // Clear the zoom coordinates after a short delay to allow for future clicks
    setTimeout(() => setZoomToCoordinates(null), 100);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-96 bg-card shadow-lg z-10 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-card-foreground">Mapsy</h1>
            <ThemeToggle />
          </div>
          <button onClick={handleDirectionsToggle} className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDirectionsMode ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {isDirectionsMode ? 'Exit Directions' : 'Get Directions'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isDirectionsMode ? (
            <DirectionsPanel
              origin={currentLocation}
              destination={destination}
              onRouteCalculated={handleRouteCalculated}
              route={route}
              onStepClick={handleStepClick}
            />
          ) : (
            <SearchPanel
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapView
          selectedLocation={selectedLocation}
          currentLocation={currentLocation}
          route={route}
          onCurrentLocationFound={handleCurrentLocationFound}
          onLocationSelect={handleLocationSelect}
          zoomToCoordinates={zoomToCoordinates}
        />
      </div>
    </div>
  );
};

export default Index;
