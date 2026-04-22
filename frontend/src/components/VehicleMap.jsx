import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, MapPin, Navigation } from 'lucide-react';
import MovingVehicleMarker from './MovingVehicleMarker';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Markers are handled by MovingVehicleMarker.jsx with custom emoji logic.

const startIcon = new L.DivIcon({
  html: '<div style="font-size: 24px;">🚩</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const endIcon = new L.DivIcon({
  html: '<div style="font-size: 24px;">🏁</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to dynamically center map only when props change significantly
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    const currentCenter = map.getCenter();
    const distance = Math.sqrt(
      Math.pow(currentCenter.lat - center[0], 2) + 
      Math.pow(currentCenter.lng - center[1], 2)
    );
    
    // Only center if distance is significant (e.g. new vehicle selected)
    // or if the map is far from the target
    if (distance > 0.01) {
      map.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);
  return null;
}

const VehicleMap = ({ 
  vehicles = [], 
  routePath = [], 
  center = [11.1271, 78.6569], 
  zoom = 7,
  selectedVehicle = null,
  showGeofences = false,
  geofences = []
}) => {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl border-4 border-white relative group">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <ChangeView center={center} zoom={zoom} />

        {/* Route Line */}
        {routePath.length > 0 && (
          <Polyline 
            positions={routePath} 
            color="#22c55e" 
            weight={6} 
            opacity={0.8} 
            lineJoin="round"
          />
        )}

        {/* Start & End Markers */}
        {routePath.length > 0 && (
          <>
            <Marker position={routePath[0]} icon={startIcon}>
              <Popup>Start Location</Popup>
            </Marker>
            <Marker position={routePath[routePath.length - 1]} icon={endIcon}>
              <Popup>Destination</Popup>
            </Marker>
          </>
        )}

        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <MovingVehicleMarker 
            key={vehicle.id || vehicle._id} 
            vehicle={vehicle} 
            autoFollow={selectedVehicle?._id === (vehicle.id || vehicle._id)}
          />
        ))}

        {/* Geofences (Basic Implementation) */}
        {showGeofences && geofences.map(gf => (
           gf.type === 'polygon' && (
             <Polyline 
               key={gf._id} 
               positions={gf.coordinates} 
               color={gf.zone_type === 'restricted' ? '#ef4444' : '#22c55e'} 
               weight={2}
               dashArray="5, 5"
               fill={true}
               fillOpacity={0.1}
             />
           )
        ))}
      </MapContainer>

      {/* Map Overlay Controls */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center gap-4 text-xs font-semibold text-gray-700">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Route Path</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-1">
             <Bus size={14} className="text-orange-500" />
             <span>Active Vehicle</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleMap;
