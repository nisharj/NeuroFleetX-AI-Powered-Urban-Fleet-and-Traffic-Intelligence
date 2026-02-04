import { useRef, useState, useEffect } from "react";
import axios from "axios";

function LocationSearch({ value, onChange, placeholder = "Enter location" }) {
  const debounceTimerRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState(value?.address || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync internal query state with parent value
  useEffect(() => {
    if (value?.address && value.address !== query) {
      setQuery(value.address);
    }
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // NOMINATIM API for geocoding
  const searchNominatim = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: searchQuery,
            format: "json",
            limit: 5,
          },
        },
      );

      setSuggestions(response.data);
    } catch (error) {
      console.error("Nominatim search error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const displayName = suggestion.display_name || `${suggestion.name}`;
    onChange({
      address: displayName,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setQuery(displayName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (input) => {
    setQuery(input);
    onChange({ address: input, lat: null, lng: null });

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (input.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      searchNominatim(input);
      setShowSuggestions(true);
    }, 500);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() =>
          query.length >= 3 &&
          suggestions.length > 0 &&
          setShowSuggestions(true)
        }
        placeholder={placeholder}
        className="form-input"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {suggestions.map((item) => (
            <div
              key={item.place_id}
              className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
              onClick={() => handleSuggestionSelect(item)}
            >
              <div className="mt-0.5 min-w-[16px] text-blue-600">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.display_name.split(",")[0]}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {item.display_name.split(",").slice(1).join(",")}
                </p>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 p-1.5 text-center text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Powered by OpenStreetMap
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

export default LocationSearch;
