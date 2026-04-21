import React, { useState, useEffect } from 'react';
import VehicleMap from '../components/VehicleMap';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward,
  Calendar,
  Clock,
  Navigation,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const TripPlaybackPage = ({ tripId = '66252bf4456a0c0017e8d2e1' }) => {
  const [playbackData, setPlaybackData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loading, setLoading] = useState(true);

  // Demo route points if API not ready
  const demoHistory = Array.from({ length: 50 }, (_, i) => ({
    latitude: 11.1271 + (i * 0.005),
    longitude: 78.6569 + (Math.sin(i / 5) * 0.01),
    speed: 40 + Math.random() * 20,
    timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString()
  }));

  useEffect(() => {
    fetchPlaybackData();
  }, [tripId]);

  useEffect(() => {
    let timer;
    if (isPlaying && playbackData && currentIndex < playbackData.history.length - 1) {
      timer = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 1000 / playbackSpeed);
    } else if (currentIndex >= (playbackData?.history?.length || 0) - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex, playbackData, playbackSpeed]);

  const fetchPlaybackData = async () => {
    try {
      const response = await axios.get(`/api/tracking/playback/${tripId}`);
      if (response.data.success) {
        setPlaybackData(response.data.data);
      } else {
        setPlaybackData({
          trip: { registration_number: 'TN-01-AX-1234', start_time: new Date().toISOString() },
          history: demoHistory
        });
      }
    } catch (err) {
      setPlaybackData({
        trip: { registration_number: 'TN-01-AX-1234', start_time: new Date().toISOString() },
        history: demoHistory
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPoint = playbackData?.history[currentIndex];

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Loading Fleet History...</div>;

  return (
    <div className="h-screen bg-gray-900 flex flex-col text-white">
      {/* Top Navigation */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              Trip Replay: <span className="text-blue-400">{playbackData?.trip?.registration_number}</span>
            </h1>
            <div className="flex gap-4 text-xs text-gray-400 font-medium mt-0.5">
              <span className="flex items-center gap-1"><Calendar size={12} /> Apr 21, 2026</span>
              <span className="flex items-center gap-1"><Clock size={12} /> 08:30 AM - 10:45 AM</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
          {[1, 2, 5, 10].map(speed => (
            <button 
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${playbackSpeed === speed ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Info */}
        <div className="w-80 bg-black/20 border-r border-white/10 p-6 flex flex-col gap-6">
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-inner">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Current Point Analytics</h3>
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                     <Navigation size={14} className="text-blue-400" /> Speed
                   </div>
                   <div className="text-lg font-black">{Math.round(currentPoint?.speed || 0)} <span className="text-[10px] text-gray-500 font-bold">KM/H</span></div>
                 </div>
                 <div className="flex justify-between items-center">
                   <div className="text-sm font-medium text-gray-400 flex items-center gap-2">
                     <Clock size={14} className="text-orange-400" /> Time
                   </div>
                   <div className="text-sm font-bold text-gray-200">
                     {new Date(currentPoint?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </div>
                 </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-5 border border-blue-500/30">
               <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Trip Summary</h3>
               <div className="space-y-3">
                 <div className="flex items-start gap-3">
                   <MapPin size={16} className="text-green-500 mt-1" />
                   <div>
                     <p className="text-[10px] text-gray-500 font-bold">STARTING POINT</p>
                     <p className="text-xs font-bold">Chennai Central Depot</p>
                   </div>
                 </div>
                 <div className="h-6 w-0.5 bg-white/10 ml-2"></div>
                 <div className="flex items-start gap-3">
                   <MapPin size={16} className="text-red-500 mt-1" />
                   <div>
                     <p className="text-[10px] text-gray-500 font-bold">DESTINATION</p>
                     <p className="text-xs font-bold">Madurai Bus Terminus</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="mt-auto">
            <button className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
              Generate Violations Report
            </button>
          </div>
        </div>

        {/* Map View */}
        <div className="flex-1 relative">
           <VehicleMap 
              vehicles={[currentPoint]} 
              routePath={playbackData.history.map(h => [h.latitude, h.longitude])}
              center={[currentPoint?.latitude || 11.1271, currentPoint?.longitude || 78.6569]}
              zoom={12}
           />

           {/* Timeline Controls */}
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl z-[1000]">
             <div className="bg-black/60 backdrop-blur-2xl px-8 py-6 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-center gap-6 mb-6">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-blue-500/20"
                  >
                    {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} className="ml-1" fill="white" />}
                  </button>
                  
                  <button 
                    onClick={() => setCurrentIndex(0)}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <RotateCcw size={20} />
                  </button>

                  <div className="flex-1 flex flex-col gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max={playbackData.history.length - 1} 
                      value={currentIndex}
                      onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 tracking-widest">
                      <span>0% COMPLETION</span>
                      <span>{Math.round((currentIndex / (playbackData.history.length - 1)) * 100)}%</span>
                      <span>100% ARRIVAL</span>
                    </div>
                  </div>
                  
                  <div className="text-sm font-black bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                     {Math.round((currentIndex / playbackData.history.length) * (playbackData.history.length * 3))} 
                     <span className="text-[10px] ml-1 text-gray-500">KM</span>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlaybackPage;
