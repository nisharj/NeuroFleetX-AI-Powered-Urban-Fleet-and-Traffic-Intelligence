import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { useRef } from "react";

export default function LocationSearch({ onSelect, placeholder }) {
  const inputRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const handlePlaceChanged = () => {
    const place = inputRef.current.getPlace();

    if (!place || !place.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    onSelect({
      address: place.formatted_address,
      lat,
      lng,
    });
  };

  if (!isLoaded) return <p>Loading...</p>;

  return (
    <Autocomplete
      onLoad={(auto) => (inputRef.current = auto)}
      onPlaceChanged={handlePlaceChanged}
    >
      <input
        type="text"
        placeholder={placeholder}
        className="w-full border p-2 rounded outline-none"
      />
    </Autocomplete>
  );
}
