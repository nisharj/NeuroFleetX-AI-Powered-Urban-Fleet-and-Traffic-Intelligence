import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";
import MAP_CONFIG from "../../config/googleMaps";
import { reverseGeocode } from "../../utils/googleMapsLoader";

// Fix Leaflet default marker icon issue with Vite
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

const containerStyle = {
  width: "100%",
  height: "300px",
};

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onLocationSelect({ address, lat, lng });
    },
  });
  return null;
}

export default function MapPicker({ onSelect }) {
  const [marker, setMarker] = useState(null);

  const handleLocationSelect = (location) => {
    setMarker([location.lat, location.lng]);
    onSelect(location);
  };

  return (
    <div style={containerStyle}>
      <MapContainer
        center={[MAP_CONFIG.defaultCenter.lat, MAP_CONFIG.defaultCenter.lng]}
        zoom={MAP_CONFIG.defaultZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={MAP_CONFIG.tileLayer.url}
          attribution={MAP_CONFIG.tileLayer.attribution}
        />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        {marker && <Marker position={marker} />}
      </MapContainer>
    </div>
  );
}
