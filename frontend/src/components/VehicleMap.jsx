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

// Custom Bus Icon
const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

const startIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const endIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to dynamically center map
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
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
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={center} zoom={zoom} />

        {/* Route Line */}
        {routePath.length > 0 && (
          <Polyline 
            positions={routePath} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.7} 
            dashArray="10, 10"
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
               color={gf.zone_type === 'restricted' ? 'red' : 'green'} 
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
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Route</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
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
