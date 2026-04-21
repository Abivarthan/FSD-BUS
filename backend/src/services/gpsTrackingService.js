const axios = require('axios');
const GpsLog = require('../models/GpsLog');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Geofence = require('../models/Geofence');

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || 'http://localhost:8082/api';
const TRACCAR_USER = process.env.TRACCAR_USER;
const TRACCAR_PASS = process.env.TRACCAR_PASS;

const simulatedSessions = new Map();

class GpsTrackingService {
  constructor() {
    // Advance all simulations every 3 seconds
    setInterval(() => this.advanceSimulation(), 3000);
  }

  async getLivePositions() {
    try {
      // Fetch simulations
      const simulatedPositions = Array.from(simulatedSessions.values()).map(s => s.lastPos);
      
      // If Traccar is configured, fetch from it
      if (TRACCAR_USER && TRACCAR_PASS) {
        // Implementation for Traccar API would go here
      }
      
      // Fallback: Also return latest positions from GpsLog for non-simulated vehicles
      const latestPositions = await GpsLog.aggregate([
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$vehicle_id',
            latest: { $first: '$$ROOT' }
          }
        }
      ]);
      
      const realPositions = latestPositions
        .map(p => p.latest)
        .filter(p => !simulatedPositions.some(s => s.vehicle_id.toString() === p.vehicle_id.toString()));

      return [...simulatedPositions, ...realPositions];
    } catch (error) {
       console.error('Error fetching live positions:', error.message);
       return [];
    }
  }

  async startSimulatingTrip(tripId) {
    const trip = await Trip.findById(tripId).populate('vehicle_id');
    if (!trip || !trip.route_path || trip.route_path.length === 0) return null;

    simulatedSessions.set(tripId.toString(), {
      tripId,
      vehicleId: trip.vehicle_id._id,
      path: trip.route_path,
      currentIndex: 0,
      lastPos: {
        vehicle_id: trip.vehicle_id._id,
        registration_number: trip.vehicle_id.registration_number,
        latitude: trip.route_path[0][0],
        longitude: trip.route_path[0][1],
        speed: 40,
        timestamp: new Date()
      }
    });

    return simulatedSessions.get(tripId.toString());
  }

  async advanceSimulation() {
    for (const [tripId, session] of simulatedSessions.entries()) {
      session.currentIndex = (session.currentIndex + 1) % session.path.length;
      const nextCoord = session.path[session.currentIndex];
      session.lastPos = {
        ...session.lastPos,
        latitude: nextCoord[0],
        longitude: nextCoord[1],
        timestamp: new Date(),
        speed: 40 + Math.random() * 10
      };

      // Auto-save to GpsLog to keep history for playback
      await this.processGpsUpdate({
        vehicle_id: session.vehicleId,
        trip_id: tripId,
        latitude: nextCoord[0],
        longitude: nextCoord[1],
        speed: session.lastPos.speed
      });
    }
  }

  async getHistory(vehicleId, startTime, endTime) {
    return await GpsLog.find({
      vehicle_id: vehicleId,
      timestamp: { $gte: new Date(startTime), $lte: new Date(endTime) }
    }).sort({ timestamp: 1 });
  }

  async processGpsUpdate(data) {
    const { vehicle_id, latitude, longitude, speed, heading, trip_id } = data;
    
    const log = new GpsLog({
      vehicle_id,
      trip_id,
      latitude,
      longitude,
      speed,
      heading,
      timestamp: new Date()
    });
    await log.save();
    return log;
  }
}

module.exports = new GpsTrackingService();
