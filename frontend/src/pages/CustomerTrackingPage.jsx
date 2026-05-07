import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';

// ── Tamil Nadu district coordinates ─────────────────────────────────────────
const DISTRICT_COORDS = {
  'Ariyalur':        [11.1402, 79.0792],
  'Chengalpattu':    [12.6921, 79.9762],
  'Chennai':         [13.0827, 80.2707],
  'Coimbatore':      [11.0168, 76.9558],
  'Cuddalore':       [11.7447, 79.7689],
  'Dharmapuri':      [12.1211, 78.1582],
  'Dindigul':        [10.3673, 77.9803],
  'Erode':           [11.3410, 77.7172],
  'Kallakurichi':    [11.7380, 78.9590],
  'Kanchipuram':     [12.8342, 79.7036],
  'Kanyakumari':     [ 8.0883, 77.5385],
  'Karur':           [10.9601, 78.0766],
  'Krishnagiri':     [12.5186, 78.2138],
  'Madurai':         [ 9.9252, 78.1198],
  'Mayiladuthurai':  [11.1036, 79.6538],
  'Nagapattinam':    [10.7672, 79.8449],
  'Namakkal':        [11.2189, 78.1674],
  'Nilgiris':        [11.4916, 76.7337],
  'Perambalur':      [11.2304, 78.8802],
  'Pudukkottai':     [10.3797, 78.8204],
  'Ramanathapuram':  [ 9.3762, 78.8309],
  'Ranipet':         [12.9224, 79.3328],
  'Salem':           [11.6643, 78.1460],
  'Sivaganga':       [ 9.8473, 78.4857],
  'Tenkasi':         [ 8.9593, 77.3152],
  'Thanjavur':       [10.7870, 79.1378],
  'Theni':           [10.0104, 77.4770],
  'Thoothukudi':     [ 8.7642, 78.1348],
  'Tiruchirappalli': [10.7905, 78.7047],
  'Tirunelveli':     [ 8.7139, 77.7567],
  'Tirupathur':      [12.4967, 78.5658],
  'Tiruppur':        [11.1085, 77.3411],
  'Tiruvallur':      [13.1431, 79.9090],
  'Tiruvannamalai':  [12.2253, 79.0747],
  'Tiruvarur':       [10.7726, 79.6371],
  'Vellore':         [12.9165, 79.1325],
  'Viluppuram':      [11.9401, 79.4861],
  'Virudhunagar':    [ 9.5851, 77.9624],
};

// ── Generate N interpolated waypoints between two lat/lng coords ─────────────
function interpolatePath(start, end, steps = 1000) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Add a slight sine-wave lateral offset for a natural-looking road curve
    const lateral = Math.sin(t * Math.PI) * 0.25;
    const perpLat = -(end[1] - start[1]) / 100 * lateral;
    const perpLng =  (end[0] - start[0]) / 100 * lateral;
    pts.push([
      start[0] + (end[0] - start[0]) * t + perpLat,
      start[1] + (end[1] - start[1]) * t + perpLng,
    ]);
  }
  return pts;
}

// ── Leaflet icon setup ───────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const makeBusIcon = (isMoving) => new L.DivIcon({
  html: `<div style="
      background: ${isMoving ? '#2563eb' : '#6b7280'};
      border-radius: 50%;
      width: 46px; height: 46px;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(37,99,235,0.5);
      font-size: 24px;
      transition: background 0.5s;
  ">🚌</div>`,
  className: '',
  iconSize: [46, 46],
  iconAnchor: [23, 23],
});

const dotIcon = (color) => new L.DivIcon({
  html: `<div style="background:${color}; border-radius:50%; width:14px; height:14px; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ── Auto-pan helper ──────────────────────────────────────────────────────────
function PanTo({ position }) {
  const map = useMap();
  const firstRef = useRef(true);
  useEffect(() => {
    if (!position) return;
    if (firstRef.current) {
      map.setView(position, 9, { animate: false });
      firstRef.current = false;
    } else {
      map.panTo(position, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CustomerTrackingPage() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  const [bookingData, setBookingData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [routePath, setRoutePath]       = useState([]);
  const [busIndex, setBusIndex]         = useState(0);
  const [speed, setSpeed]               = useState(42); // simulated km/h display
  const [arrived, setArrived]           = useState(false);

  // Fetch booking info (route name, origin, destination, seat, etc.)
  const fetchBooking = useCallback(async () => {
    try {
      // Use bookings endpoint to get the booking with populated route
      const res = await api.get(`/bookings/${bookingId}`);
      if (res.data.success) {
        setBookingData(res.data.data);
      }
    } catch {
      // Silently handle — we'll still show the animated bus
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  // Build the interpolated path once we know origin & destination
  useEffect(() => {
    if (!bookingData?.route) return;
    const origin = DISTRICT_COORDS[bookingData.route.origin];
    const dest   = DISTRICT_COORDS[bookingData.route.destination];
    if (origin && dest) {
      setRoutePath(interpolatePath(origin, dest, 1000));
      setBusIndex(0);
      setArrived(false);
    }
  }, [bookingData]);

  // Animate bus along path — advances smoothly and gradually
  useEffect(() => {
    if (routePath.length === 0) return;
    const interval = setInterval(() => {
      setBusIndex(prev => {
        if (prev >= routePath.length - 1) {
          setArrived(true);
          clearInterval(interval);
          return prev;
        }
        // Vary speed slightly for realism (45-65 km/h)
        setSpeed(45 + Math.floor(Math.random() * 20));
        return prev + 1;
      });
    }, 1000); // 1 update per second for smooth slow movement
    return () => clearInterval(interval);
  }, [routePath]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading live tracking…</p>
      </div>
    </div>
  );

  const route    = bookingData?.route   || {};
  const booking  = bookingData          || {};
  const busPos   = routePath[busIndex]  || null;
  const progress = routePath.length > 1 ? Math.round((busIndex / (routePath.length - 1)) * 100) : 0;
  const isMoving = !arrived && busIndex > 0;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg">Live Bus Tracking</h1>
          <p className="text-gray-400 text-xs flex items-center gap-1.5">
            {!arrived ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live Simulation · {route.origin} → {route.destination}
              </>
            ) : (
              <span className="text-green-400 font-bold">✅ Bus has arrived at {route.destination}</span>
            )}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
          arrived
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : isMoving
            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
            : 'bg-gray-700 text-gray-400 border-gray-600'
        }`}>
          {arrived ? '🏁 Arrived' : isMoving ? `🚀 ${speed} km/h` : '⏳ Starting…'}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-0">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-80 bg-gray-900 border-r border-gray-800 p-6 space-y-5 overflow-y-auto">

          {/* Route */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">Your Route</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-3 h-3 bg-green-500 rounded-full flex-shrink-0 shadow-lg shadow-green-500/40" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">FROM</p>
                  <p className="text-white font-bold text-base">{route.origin || '—'}</p>
                </div>
              </div>
              <div className="ml-1.5 border-l-2 border-dashed border-gray-600 h-4" />
              <div className="flex items-start gap-3">
                <div className="mt-1 w-3 h-3 bg-red-500 rounded-full flex-shrink-0 shadow-lg shadow-red-500/40" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">TO</p>
                  <p className="text-white font-bold text-base">{route.destination || '—'}</p>
                </div>
              </div>
            </div>
            {/* Distance & Duration */}
            <div className="mt-4 flex gap-3">
              {route.distance && (
                <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Distance</p>
                  <p className="text-white font-bold text-sm">{route.distance}</p>
                </div>
              )}
              {route.duration && (
                <div className="flex-1 bg-gray-900 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-gray-500 uppercase">Duration</p>
                  <p className="text-white font-bold text-sm">{route.duration}</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-gray-800 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Trip Progress</p>
              <p className="text-blue-400 font-black text-sm">{progress}%</p>
            </div>
            <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              <span>{route.origin}</span>
              <span>{route.destination}</span>
            </div>
          </div>

          {/* Bus info */}
          <div className="bg-gray-800 rounded-2xl p-5 space-y-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Bus Status</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-2xl">🚌</div>
              <div>
                <p className="text-white font-black">{route.bus_type || 'Bus'}</p>
                <p className={`text-xs font-bold ${isMoving ? 'text-green-400' : arrived ? 'text-green-300' : 'text-amber-400'}`}>
                  {arrived ? 'Arrived at Destination' : isMoving ? 'In Transit' : 'Preparing to Depart'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-[10px] uppercase">Speed</p>
                <p className="text-white font-bold">{isMoving ? `${speed} km/h` : '0 km/h'}</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-500 text-[10px] uppercase">Covered</p>
                <p className="text-white font-bold">{progress}%</p>
              </div>
              {busPos && (
                <>
                  <div className="bg-gray-900 rounded-xl p-3">
                    <p className="text-gray-500 text-[10px] uppercase">Lat</p>
                    <p className="text-white font-bold text-xs">{busPos[0].toFixed(4)}</p>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-3">
                    <p className="text-gray-500 text-[10px] uppercase">Lng</p>
                    <p className="text-white font-bold text-xs">{busPos[1].toFixed(4)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Booking info */}
          <div className="bg-gray-800 rounded-2xl p-5 space-y-3">
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Booking Info</p>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400 text-sm">Seat</span>
              <span className="text-white font-bold">{booking.seat_number || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400 text-sm">Departure</span>
              <span className="text-white font-bold">{booking.departure_time || '—'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400 text-sm">Status</span>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                {booking.status || 'Confirmed'}
              </span>
            </div>
          </div>

        </div>

        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 relative min-h-[420px]">
          <MapContainer
            center={routePath[0] || [11.1271, 78.6569]}
            zoom={9}
            style={{ height: '100%', width: '100%', minHeight: '420px' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* Pan to bus */}
            {busPos && <PanTo position={busPos} />}

            {/* Full route (grey — the road ahead) */}
            {routePath.length > 1 && (
              <Polyline
                positions={routePath}
                color="#374151"
                weight={4}
                opacity={0.7}
              />
            )}

            {/* Travelled portion (blue) */}
            {busIndex > 0 && (
              <Polyline
                positions={routePath.slice(0, busIndex + 1)}
                color="#3b82f6"
                weight={4}
                opacity={0.9}
              />
            )}

            {/* Origin pin */}
            {routePath[0] && (
              <Marker position={routePath[0]} icon={dotIcon('#22c55e')}>
                <Popup>{route.origin}</Popup>
              </Marker>
            )}

            {/* Destination pin */}
            {routePath[routePath.length - 1] && (
              <Marker position={routePath[routePath.length - 1]} icon={dotIcon('#ef4444')}>
                <Popup>{route.destination}</Popup>
              </Marker>
            )}

            {/* Animated bus icon */}
            {busPos && (
              <Marker position={busPos} icon={makeBusIcon(isMoving)}>
                <Popup>
                  <div className="p-1 text-center">
                    <p className="font-bold">🚌 {route.bus_type || 'Bus'}</p>
                    <p className="text-xs text-gray-500">{isMoving ? `${speed} km/h` : 'Stopped'}</p>
                    <p className="text-xs text-blue-600 mt-1">{progress}% of journey</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-gray-900/90 backdrop-blur-md px-4 py-3 rounded-xl border border-gray-700 text-xs text-gray-300 flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full" /> Origin
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Destination
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Covered
            </div>
            <div className="flex items-center gap-1.5">
              🚌 Your Bus
            </div>
          </div>

          {/* Arrived banner */}
          {arrived && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2">
              🏁 Your bus has arrived at {route.destination}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
