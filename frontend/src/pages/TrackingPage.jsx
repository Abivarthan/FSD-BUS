import React, { useState, useEffect } from 'react';
import VehicleMap from '../components/VehicleMap';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Navigation, 
  AlertTriangle, 
  Settings, 
  History,
  Activity,
  User,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const TrackingPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [geofences, setGeofences] = useState([]);
  const [showGeofences, setShowGeofences] = useState(true);
  const [routePath, setRoutePath] = useState([]);
  const [isDeviceTracking, setIsDeviceTracking] = useState(false);
  const [trackingWatchId, setTrackingWatchId] = useState(null);

  // Mock data for initial demo if API fails
  const mockVehicles = [
    { _id: '69c3f23467e1f48c2d10b17a', registration_number: 'KA-01-BK-9999', latitude: 13.0827, longitude: 80.2707, speed: 45, status: 'moving', driver: 'Arun Kumar' },
    { _id: '69c3f23467e1f48c2d10b180', registration_number: 'MH-01-XY-1234', latitude: 11.0168, longitude: 76.9558, speed: 0, status: 'idle', driver: 'Senthil' },
    { _id: '69c3f23467e1f48c2d10b186', registration_number: 'DL-01-HT-5678', latitude: 9.9252, longitude: 78.1198, speed: 60, status: 'moving', driver: 'Mani' },
  ];

  useEffect(() => {
    fetchLiveLocations();
    
    // Web Socket Live Listener
    socket.on('vehicleLocation', (data) => {
      console.log('Real-time GPS update received:', data);
      setVehicles(prev => {
        const index = prev.findIndex(v => (v.id || v._id) === data.vehicle_id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...data };
          return updated;
        } else {
          // Add new vehicle if it's from a live source but not in list
          return [...prev, {
            _id: data.vehicle_id,
            registration_number: data.registration_number || 'LIVE-UNIT',
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            status: 'moving',
            driver: data.driver || 'Live Driver'
          }];
        }
      });
    });

    const interval = setInterval(fetchLiveLocations, 30000); // Polling as fallback (slower)
    return () => {
      socket.off('vehicleLocation');
      clearInterval(interval);
    };
  }, []);

  const fetchLiveLocations = async () => {
    try {
      const response = await api.get('/tracking/live');
      if (response.data.success && response.data.data.length > 0) {
        setVehicles(response.data.data);
      } else {
        setVehicles(mockVehicles);
      }
    } catch (error) {
      console.warn('API error, using mock data');
      setVehicles(mockVehicles);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = async (vehicleId) => {
    try {
      console.log('Starting enhanced simulation for vehicle:', vehicleId);
      const response = await api.post(`/tracking/simulate/${vehicleId}`, {
        start_location: { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
        end_location: { name: 'Madurai Junction', lat: 9.9252, lng: 78.1198 }
      });
      
      if (response.data.success) {
        setRoutePath([
          [13.0827, 80.2707],
          [12.6767, 79.9120], // Chengalpattu
          [11.9416, 79.4861], // Villupuram
          [10.7905, 78.7047], // Trichy
          [9.9252, 78.1198]   // Madurai
        ]);
        alert('Real-time Simulation Engine Started: ' + response.data.data.trip_id);
      }
    } catch (error) {
      console.error('Simulation failed:', error.response?.data?.message || error.message);
      alert('Simulation failed: ' + (error.response?.data?.message || 'Check connection'));
    }
  };

  const toggleDeviceTracking = (vehicleId) => {
    if (isDeviceTracking) {
      if (trackingWatchId) navigator.geolocation.clearWatch(trackingWatchId);
      setTrackingWatchId(null);
      setIsDeviceTracking(false);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
      }
      
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await api.post('/tracking/update', {
              vehicle_id: vehicleId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed: position.coords.speed || 0,
              heading: position.coords.heading || 0
            });
          } catch (err) {
            console.error('Failed to send GPS update:', err);
          }
        },
        (err) => console.error('GPS Error:', err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      
      setTrackingWatchId(watchId);
      setIsDeviceTracking(true);
      alert("Device GPS active. You are now the 'Real Driver' for this vehicle.");
    }
  };

  const stats = [
    { label: 'Active Vehicles', value: vehicles.length, icon: Bus, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Moving', value: vehicles.filter(v => v.speed > 0).length, icon: Navigation, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Alerts', value: 2, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'On Time', value: '94%', icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Area */}
      <div className="bg-white border-b px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vehicle Real-time Tracking</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Tamil Nadu State Fleet Operations • Live View
            </p>
          </div>
          
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-4 gap-6 px-8 py-8">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow"
          >
            <div className={`${stat.bg} p-4 rounded-xl`}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Map & Detail Section */}
      <div className="flex-1 px-8 pb-8 flex gap-8">
        {/* Sidebar */}
        <div className="w-1/4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border p-5 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Fleet List</h2>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-bold uppercase tracking-wider">Tamil Nadu</span>
            </div>
            
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Search registration number..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <Bus className="absolute left-3 top-3 text-gray-400" size={16} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {vehicles.map((v) => (
                <div 
                  key={v._id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                    selectedVehicle?._id === v._id 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{v.registration_number}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      v.speed > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {v.speed > 0 ? 'Moving' : 'Idle'}
                    </span>
                    {!mockVehicles.some(mv => mv._id === v._id) && (
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                        LIVE GPS
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User size={14} className="text-gray-400" />
                      <span className="font-bold text-gray-700">{v.driver || 'Driver'}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-2">
                    <MapPin size={12} />
                    <span>{v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest mb-4">Security Center</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Geofencing Alerts</span>
                <div 
                  onClick={() => setShowGeofences(!showGeofences)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${showGeofences ? 'bg-blue-500' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showGeofences ? 'left-6' : 'left-1'}`}></div>
                </div>
              </div>
              <button 
                onClick={() => toggleDeviceTracking(selectedVehicle?._id || vehicles[0]?._id)}
                className={`w-full py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
                  isDeviceTracking ? 'bg-green-500 text-white border-green-600' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/20'
                }`}
              >
                <ShieldCheck size={16} />
                {isDeviceTracking ? 'Tracking My Device' : 'Enable My GPS as Driver'}
              </button>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
           <VehicleMap 
              vehicles={vehicles} 
              selectedVehicle={selectedVehicle}
              routePath={routePath}
              center={selectedVehicle ? [selectedVehicle.latitude, selectedVehicle.longitude] : [11.1271, 78.6569]}
              zoom={selectedVehicle ? 14 : 7}
              showGeofences={showGeofences}
           />
           
           {/* Detailed Card for Selected Vehicle */}
           <AnimatePresence>
             {selectedVehicle && (
               <motion.div 
                 initial={{ opacity: 0, x: 100 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 100 }}
                 className="absolute top-6 right-6 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 z-[1000]"
               >
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <h3 className="text-xl font-black text-gray-900">{selectedVehicle.registration_number}</h3>
                     <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Real-time Telemetry</p>
                   </div>
                   <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-gray-600">
                     <AlertTriangle size={20} />
                   </button>
                 </div>

                 <div className="space-y-4">
                   <div className="flex justify-between items-center py-3 border-b border-gray-100">
                     <div className="flex items-center gap-2 text-gray-500 font-medium">
                       <Navigation size={16} />
                       <span>Speed</span>
                     </div>
                     <span className="font-bold text-gray-900">{selectedVehicle.speed} km/h</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-gray-100">
                     <div className="flex items-center gap-2 text-gray-500 font-medium">
                       <User size={16} />
                       <span>Driver</span>
                     </div>
                     <span className="font-bold text-gray-900">{selectedVehicle.driver}</span>
                   </div>
                   <div className="flex justify-between items-center py-3 border-b border-gray-100">
                     <div className="flex items-center gap-2 text-gray-500 font-medium">
                       <Clock size={16} />
                       <span>Last Update</span>
                     </div>
                     <span className="font-bold text-gray-900 text-xs text-green-600">Just now</span>
                   </div>
                 </div>

                 <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => handleStartSimulation(selectedVehicle?._id)}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Activity size={18} />
                      Start Simulation
                    </button>
                    <button 
                      onClick={() => navigate('/reports/optimization')}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                    >
                      Analysis
                    </button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
