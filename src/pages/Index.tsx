import React, { useState } from 'react';
import MapView from '@/components/MapView';
import SearchPanel from '@/components/SearchPanel';
import DirectionsPanel from '@/components/DirectionsPanel';
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-96 bg-white shadow-lg z-10 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mapsy</h1>
          <button onClick={handleDirectionsToggle} className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDirectionsMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
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
