import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Location, SearchResult } from '@/types/maps';

interface SearchPanelProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  onLocationSelect,
  selectedLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Location[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  const saveToRecent = (location: Location) => {
    const updated = [location, ...recentSearches.filter(r => r.id !== location.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Using Nominatim (OpenStreetMap) geocoding API - completely free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();

      const results: SearchResult[] = data.map((item: any, index: number) => ({
        id: item.place_id?.toString() || index.toString(),
        name: item.display_name.split(',')[0],
        address: item.display_name,
        coordinates: [parseFloat(item.lon), parseFloat(item.lat)] as [number, number],
        type: item.type || 'place',
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleLocationClick = (result: SearchResult) => {
    const location: Location = {
      id: result.id,
      name: result.name,
      address: result.address,
      coordinates: result.coordinates,
    };
    
    onLocationSelect(location);
    saveToRecent(location);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRecentClick = (location: Location) => {
    onLocationSelect(location);
  };

  return (
    <div className="p-6">
      {/* Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search for a place..."
          value={searchQuery}
          onChange={handleSearchInputChange}
          className="pl-10 pr-4 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Search Results</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleLocationClick(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{result.name}</p>
                      <p className="text-sm text-gray-500 truncate">{result.address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No results found</p>
          )}
        </div>
      )}

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Recent Searches
          </h3>
          <div className="space-y-2">
            {recentSearches.map((location) => (
              <button
                key={location.id}
                onClick={() => handleRecentClick(location)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors duration-200"
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground truncate">{location.name}</p>
                    <p className="text-sm text-gray-500 truncate">{location.address}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Selected Location</h3>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900">{selectedLocation.name}</p>
              <p className="text-sm text-blue-700">{selectedLocation.address}</p>
              <p className="text-xs text-blue-600 mt-1">
                {selectedLocation.coordinates[1].toFixed(6)}, {selectedLocation.coordinates[0].toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;
