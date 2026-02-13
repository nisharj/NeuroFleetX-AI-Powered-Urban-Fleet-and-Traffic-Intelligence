import { useState, useRef, useEffect } from "react";
import { searchAddress } from "../../utils/googleMapsLoader";

export default function LocationSearch({ onSelect, placeholder, value }) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const debounceTimeout = useRef(null);

  // Update query when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      const searchResults = await searchAddress(query);
      setResults(searchResults);
      setShowResults(searchResults.length > 0);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query]);

  const handleSelect = (result) => {
    console.log("LocationSearch - handleSelect called with:", result);
    setQuery(result.address);
    setShowResults(false);
    onSelect(result);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Search location..."}
        className="w-full border p-2 rounded outline-none"
        onFocus={() => results.length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />

      {showResults && (
        <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSelect(result)}
            >
              {result.address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
