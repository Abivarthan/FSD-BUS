import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Icons
const busIcon = new L.DivIcon({
  className: 'custom-bus-icon',
  html: `<div style="width:40px;height:40px;background:#2563EB;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 15px rgba(37,99,235,0.4);border:3px solid white;">🚌</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const originIcon = new L.DivIcon({
  className: 'custom-origin-icon',
  html: `<div style="width:30px;height:30px;background:#10B981;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const destIcon = new L.DivIcon({
  className: 'custom-dest-icon',
  html: `<div style="width:30px;height:30px;background:#EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;">🏁</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Map Control Component
function ChangeView({ center, zoom, isFollowing }) {
  const map = useMap();
  useEffect(() => {
    if (isFollowing && center) {
        map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, isFollowing, map]);
  return null;
}

export default function TrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detRes, trackRes] = await Promise.all([
          api.get(`/tracking/${id}/details`),
          api.get(`/tracking/${id}/location`)
        ]);
        setDetails(detRes.data.data);
        setTrackingData(trackRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    intervalRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/tracking/${id}/location`);
        setTrackingData(res.data.data);
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-bold tracking-widest text-xs uppercase opacity-60">Connecting GPS...</p>
      </div>
    </div>
  );

  const location = trackingData?.location;
  const routePath = trackingData?.route?.waypoints?.map(w => [w.lat, w.lng]) || [];
  const currentPos = location ? [location.lat, location.lng] : [12.9716, 77.5946];

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-white font-display font-bold text-lg">{trackingData?.route?.name || 'Live Route'}</h1>
            <p className="text-gray-500 text-xs">{trackingData?.route?.origin} → {trackingData?.route?.destination}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-800 text-gray-400'}`}
        >
          {isFollowing ? '📡 Locked on Bus' : '🔓 Free Move'}
        </button>
      </div>

      <div className="flex-1 flex relative">
        <div className="flex-1 relative z-10">
          <MapContainer center={currentPos} zoom={13} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {routePath.length > 0 && (
              <>
                <Polyline positions={routePath} pathOptions={{ color: '#2563EB', weight: 4, opacity: 0.6, dashArray: '8, 12' }} />
                <Marker position={routePath[0]} icon={originIcon} />
                <Marker position={routePath[routePath.length - 1]} icon={destIcon} />
              </>
            )}

            {location && (
              <Marker position={[location.lat, location.lng]} icon={busIcon}>
                <Popup className="custom-popup">
                  <div className="text-center font-sans p-1">
                    <p className="font-bold text-sm text-gray-900">🚌 {details?.vehicle?.model}</p>
                    <p className="text-xs text-primary font-bold mt-1">{location.speed} km/h</p>
                  </div>
                </Popup>
              </Marker>
            )}

            <ChangeView center={currentPos} zoom={14} isFollowing={isFollowing} />
          </MapContainer>

          {/* Speed Overlay */}
          {location && (
            <div className="absolute top-6 left-6 z-[1000] bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4">
               <div className="text-center px-2">
                 <p className="text-2xl font-display font-black text-gray-900">{location.speed}</p>
                 <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">km/h</p>
               </div>
               <div className="w-px h-8 bg-gray-200" />
               <div className="text-center px-2">
                 <p className="text-2xl font-display font-black text-primary">{location.eta_minutes}</p>
                 <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">min ETA</p>
               </div>
            </div>
          )}

          {/* Status Badge */}
          {location && (
            <div className="absolute top-6 right-6 z-[1000]">
               <div className="bg-white px-5 py-2.5 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-2">
                 <span className="relative flex h-2.5 w-2.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                 </span>
                 <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">In Transit</span>
               </div>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="w-[360px] bg-gray-900 border-l border-gray-800 p-6 hidden lg:block overflow-y-auto">
          <div className="space-y-6">
            <div className="bg-gray-800 p-5 rounded-2xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Trip Progress</p>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${location?.progress_percent}%` }} />
              </div>
              <p className="text-white text-right mt-2 font-bold text-xs">{location?.progress_percent}% Completed</p>
            </div>

            {details?.vehicle && (
              <div className="bg-gray-800 p-5 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Bus Info</p>
                <h3 className="text-white font-bold">{details.vehicle.model}</h3>
                <p className="text-primary text-xs font-mono mt-1">{details.vehicle.registration_number}</p>
              </div>
            )}

            {details?.driver && (
              <div className="bg-gray-800 p-5 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Your Driver</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {details.driver.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-bold">{details.driver.name}</h3>
                    <p className="text-gray-500 text-[10px]">{details.driver.rating} ★ Rating</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
