import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Route as RouteIcon, ArrowRight, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Location, Route, RouteStep } from '@/types/maps';

interface DirectionsPanelProps {
  origin: Location | null;
  destination: Location | null;
  onRouteCalculated: (route: Route) => void;
  route: Route | null;
  onStepClick?: (coordinates: [number, number]) => void;
}

interface AutocompleteResult {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  origin,
  destination,
  onRouteCalculated,
  route,
  onStepClick,
}) => {
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [originResults, setOriginResults] = useState<AutocompleteResult[]>([]);
  const [destinationResults, setDestinationResults] = useState<AutocompleteResult[]>([]);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [actualOrigin, setActualOrigin] = useState<Location | null>(null);
  const [actualDestination, setActualDestination] = useState<Location | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (origin) {
      setOriginInput(origin.address);
      setActualOrigin(origin);
    }
  }, [origin]);

  useEffect(() => {
    if (destination) {
      setDestinationInput(destination.address);
      setActualDestination(destination);
    }
  }, [destination]);

  const searchLocations = async (query: string) => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      return data.map((item: any, index: number) => ({
        id: item.place_id?.toString() || index.toString(),
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
      }));
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  };

  const handleOriginInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOriginInput(value);
    
    if (value.trim()) {
      const results = await searchLocations(value);
      setOriginResults(results);
    } else {
      setOriginResults([]);
    }
  };

  const handleDestinationInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationInput(value);
    
    if (value.trim()) {
      const results = await searchLocations(value);
      setDestinationResults(results);
    } else {
      setDestinationResults([]);
    }
  };

  const handleOriginSelect = (result: AutocompleteResult) => {
    const location: Location = {
      id: result.id,
      name: result.name,
      address: result.address,
      coordinates: result.coordinates,
    };
    setActualOrigin(location);
    setOriginInput(result.address);
    setShowOriginResults(false);
    setOriginResults([]);
  };

  const handleDestinationSelect = (result: AutocompleteResult) => {
    const location: Location = {
      id: result.id,
      name: result.name,
      address: result.address,
      coordinates: result.coordinates,
    };
    setActualDestination(location);
    setDestinationInput(result.address);
    setShowDestinationResults(false);
    setDestinationResults([]);
  };

  const calculateRoute = async () => {
    if (!actualOrigin || !actualDestination) return;

    setIsCalculating(true);
    setRouteError(null);

    try {
      // Using OSRM (Open Source Routing Machine) for routing - free OpenStreetMap service
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${actualOrigin.coordinates[0]},${actualOrigin.coordinates[1]};${actualDestination.coordinates[0]},${actualDestination.coordinates[1]}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();

      if (data.code === 'NoRoute') {
        setRouteError('No driving route available between these locations. The destinations may be in different regions or there may be no connecting roads.');
        return;
      }

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        
        const steps: RouteStep[] = routeData.legs[0].steps.map((step: any, index: number) => ({
          id: `step-${index}`,
          instruction: step.maneuver.instruction || `Step ${index + 1}`,
          distance: step.distance,
          duration: step.duration,
          coordinates: step.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]] as [number, number]),
        }));

        const calculatedRoute: Route = {
          id: 'route-1',
          origin: actualOrigin,
          destination: actualDestination,
          distance: routeData.distance,
          duration: routeData.duration,
          geometry: routeData.geometry.coordinates.map((coord: number[]) => [coord[0], coord[1]] as [number, number]),
          steps,
        };

        onRouteCalculated(calculatedRoute);
      } else {
        setRouteError('Unable to calculate route. Please try different locations or check if the destinations are accessible by road.');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      setRouteError('Route calculation failed. Please check your internet connection and try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStepClick = (step: RouteStep) => {
    setSelectedStepId(step.id);
    if (onStepClick && step.coordinates.length > 0) {
      onStepClick(step.coordinates[0]);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="p-6">
      {/* Origin and Destination Inputs */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full"></div>
          <Input
            type="text"
            placeholder="Choose starting point"
            value={originInput}
            onChange={handleOriginInputChange}
            onFocus={() => setShowOriginResults(true)}
            onBlur={() => setTimeout(() => setShowOriginResults(false), 200)}
            className="pl-9 pr-4 py-3"
          />
          {showOriginResults && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {originResults.length > 0 ? (
                originResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleOriginSelect(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <Search className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.name}</p>
                        <p className="text-sm text-gray-500 truncate">{result.address}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Start typing to search for locations
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
          <Input
            type="text"
            placeholder="Choose destination"
            value={destinationInput}
            onChange={handleDestinationInputChange}
            onFocus={() => setShowDestinationResults(true)}
            onBlur={() => setTimeout(() => setShowDestinationResults(false), 200)}
            className="pl-9 pr-4 py-3"
          />
          {showDestinationResults && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {destinationResults.length > 0 ? (
                destinationResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleDestinationSelect(result)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <Search className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{result.name}</p>
                        <p className="text-sm text-gray-500 truncate">{result.address}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Start typing to search for locations
                </div>
              )}
            </div>
          )}
        </div>

        <Button
          onClick={calculateRoute}
          disabled={!actualOrigin || !actualDestination || isCalculating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isCalculating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Calculating...
            </div>
          ) : (
            <div className="flex items-center">
              <RouteIcon className="w-4 h-4 mr-2" />
              Get Directions
            </div>
          )}
        </Button>
      </div>

      {/* Route Error Alert */}
      {routeError && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {routeError}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Route Summary */}
      {route && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-blue-900">
                {formatDuration(route.duration)}
              </span>
              <span className="text-sm text-blue-700">
                {formatDistance(route.distance)}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-blue-700">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="truncate">{route.origin.name}</span>
              <ArrowRight className="w-4 h-4 mx-2" />
              <span className="truncate">{route.destination.name}</span>
            </div>
          </div>

          {/* Turn-by-turn Directions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Navigation className="w-4 h-4 mr-2" />
              Turn-by-turn Directions
            </h3>
            
            <div className="space-y-3">
              {route.steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step)}
                  className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-colors cursor-pointer text-left ${
                    selectedStepId === step.id 
                      ? 'bg-blue-100 border-2 border-blue-300' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    selectedStepId === step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{step.instruction}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500 space-x-4">
                      <span>{formatDistance(step.distance)}</span>
                      <span>{formatDuration(step.duration)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tips</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Click on the map to set destination</li>
          <li>• Use "My Location" button for current position</li>
          <li>• Route calculation is optimized for driving</li>
        </ul>
      </div>
    </div>
  );
};

export default DirectionsPanel;
