const Geofence = require('../models/Geofence');

exports.createGeofence = async (req, res, next) => {
  try {
    const geofence = new Geofence(req.body);
    await geofence.save();
    res.status(201).json({ success: true, data: geofence });
  } catch (err) {
    next(err);
  }
};

exports.getGeofences = async (req, res, next) => {
  try {
    const geofences = await Geofence.find({ is_active: true });
    res.json({ success: true, data: geofences });
  } catch (err) {
    next(err);
  }
};

exports.updateGeofence = async (req, res, next) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: geofence });
  } catch (err) {
    next(err);
  }
};

exports.deleteGeofence = async (req, res, next) => {
  try {
    await Geofence.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Geofence deleted' });
  } catch (err) {
    next(err);
  }
};
