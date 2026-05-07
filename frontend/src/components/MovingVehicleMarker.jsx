import React, { useEffect, useState, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';

// Custom Bus Icon with rotation support
const createBusIcon = (heading = 0) => {
  return new L.DivIcon({
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.5s ease-in-out;">
        <img src="https://cdn-icons-png.flaticon.com/512/3448/3448339.png" style="width: 40px; height: 40px;" />
      </div>
    `,
    className: 'custom-bus-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const MovingVehicleMarker = ({ vehicle, autoFollow = false }) => {
  const [currentPos, setCurrentPos] = useState([vehicle.latitude, vehicle.longitude]);
  const [heading, setHeading] = useState(0);
  const prevPosRef = useRef([vehicle.latitude, vehicle.longitude]);
  const map = useMap();

  useEffect(() => {
    const newPos = [vehicle.latitude, vehicle.longitude];
    const prevPos = prevPosRef.current;

    if (newPos[0] !== prevPos[0] || newPos[1] !== prevPos[1]) {
      // Calculate heading
      const angle = Math.atan2(newPos[1] - prevPos[1], newPos[0] - prevPos[0]) * (180 / Math.PI);
      setHeading(angle + 90); // Adjusting based on icon orientation

      // Animate movement over 3 seconds (matching polling interval)
      const duration = 2800; // slightly less than 3s to avoid overlap
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const lat = prevPos[0] + (newPos[0] - prevPos[0]) * progress;
        const lng = prevPos[1] + (newPos[1] - prevPos[1]) * progress;

        setCurrentPos([lat, lng]);

        if (autoFollow && progress === 1) {
          map.panTo([lat, lng]);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          prevPosRef.current = newPos;
        }
      };

      requestAnimationFrame(animate);
    }
  }, [vehicle.latitude, vehicle.longitude, autoFollow, map]);

  return (
    <Marker position={currentPos} icon={createBusIcon(heading)}>
      <Popup className="premium-popup">
        <div className="p-3 w-64 bg-white rounded-xl">
           <div className="flex items-center gap-3 border-b pb-2 mb-3">
             <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Navigation size={20} />
             </div>
             <div>
               <h3 className="font-bold text-gray-900">{vehicle.registration_number}</h3>
               <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">In Transit</p>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Speed</p>
                <p className="text-sm font-black">{Math.round(vehicle.speed || 0)} km/h</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Status</p>
                <p className="text-sm font-black text-green-600">Active</p>
              </div>
           </div>

           <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
             <MapPin size={12} />
             <span>{currentPos[0].toFixed(5)}, {currentPos[1].toFixed(5)}</span>
           </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default MovingVehicleMarker;
