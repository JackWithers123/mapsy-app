
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Route as RouteIcon, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Location, Route, RouteStep } from '@/types/maps';

interface DirectionsPanelProps {
  origin: Location | null;
  destination: Location | null;
  onRouteCalculated: (route: Route) => void;
  route: Route | null;
}

const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  origin,
  destination,
  onRouteCalculated,
  route,
}) => {
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (origin) {
      setOriginInput(origin.address);
    }
  }, [origin]);

  useEffect(() => {
    if (destination) {
      setDestinationInput(destination.address);
    }
  }, [destination]);

  const calculateRoute = async () => {
    if (!origin || !destination) return;

    setIsCalculating(true);

    try {
      // Mock route calculation for demo
      // In real implementation, this would use Mapbox Directions API
      const mockRoute: Route = {
        id: 'route-1',
        origin,
        destination,
        distance: 5200, // 5.2 km
        duration: 780, // 13 minutes
        geometry: [
          origin.coordinates,
          [origin.coordinates[0] + 0.01, origin.coordinates[1] + 0.01],
          [destination.coordinates[0] - 0.01, destination.coordinates[1] - 0.01],
          destination.coordinates,
        ],
        steps: [
          {
            id: 'step-1',
            instruction: 'Head north on Main Street',
            distance: 800,
            duration: 120,
            coordinates: [origin.coordinates, [origin.coordinates[0], origin.coordinates[1] + 0.005]],
          },
          {
            id: 'step-2',
            instruction: 'Turn right onto Broadway',
            distance: 1200,
            duration: 180,
            coordinates: [[origin.coordinates[0], origin.coordinates[1] + 0.005], [origin.coordinates[0] + 0.01, origin.coordinates[1] + 0.01]],
          },
          {
            id: 'step-3',
            instruction: 'Continue straight for 2.1 miles',
            distance: 3200,
            duration: 480,
            coordinates: [[origin.coordinates[0] + 0.01, origin.coordinates[1] + 0.01], [destination.coordinates[0] - 0.01, destination.coordinates[1] - 0.01]],
          },
        ],
      };

      onRouteCalculated(mockRoute);
    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setIsCalculating(false);
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
            onChange={(e) => setOriginInput(e.target.value)}
            className="pl-9 pr-4 py-3"
          />
        </div>
        
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
          <Input
            type="text"
            placeholder="Choose destination"
            value={destinationInput}
            onChange={(e) => setDestinationInput(e.target.value)}
            className="pl-9 pr-4 py-3"
          />
        </div>

        <Button
          onClick={calculateRoute}
          disabled={!origin || !destination || isCalculating}
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
                <div key={step.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{step.instruction}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500 space-x-4">
                      <span>{formatDistance(step.distance)}</span>
                      <span>{formatDuration(step.duration)}</span>
                    </div>
                  </div>
                </div>
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
