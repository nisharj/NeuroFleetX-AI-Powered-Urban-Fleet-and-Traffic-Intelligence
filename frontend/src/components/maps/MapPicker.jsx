import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useState } from "react";

const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

export default function MapPicker({ onSelect }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const [marker, setMarker] = useState(null);

  const handleClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setMarker({ lat, lng });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${
        import.meta.env.VITE_GOOGLE_MAPS_KEY
      }`
    );
    const data = await res.json();

    const address = data.results?.[0]?.formatted_address || "Selected location";

    onSelect({ address, lat, lng });
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={marker || defaultCenter}
      zoom={13}
      onClick={handleClick}
    >
      {marker && <Marker position={marker} />}
    </GoogleMap>
  );
}
