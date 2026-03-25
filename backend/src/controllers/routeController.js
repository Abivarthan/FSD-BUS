const Route = require('../models/Route');
const logger = require('../utils/logger');

exports.getRoutes = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.origin) filters.origin = { $regex: req.query.origin, $options: 'i' };
    if (req.query.destination) filters.destination = { $regex: req.query.destination, $options: 'i' };
    
    // Default to active routes
    filters.is_active = true;

    const routes = await Route.find(filters).sort({ name: 1 });
    res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
};

exports.getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

exports.createRoute = async (req, res, next) => {
  try {
    const route = new Route(req.body);
    await route.save();
    logger.info(`New route created: ${route.name}`);
    res.status(201).json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

exports.updateRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

exports.deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndDelete(req.params.id);
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (err) {
    next(err);
  }
};
