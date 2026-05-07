const { body, param, query } = require('express-validator');

const validators = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'driver']).withMessage('Invalid role'),
  ],

  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  vehicle: [
    body('vehicle_type').isIn(['bus', 'car', 'van', 'truck']).withMessage('Invalid vehicle type'),
    body('registration_number').trim().notEmpty().withMessage('Registration number required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
    body('fuel_type').isIn(['diesel', 'petrol', 'electric', 'hybrid']).withMessage('Invalid fuel type'),
    body('status').optional().isIn(['active', 'inactive', 'maintenance']),
  ],

  driver: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('license_number').trim().notEmpty().withMessage('License number required'),
    body('license_expiry').isDate().withMessage('Valid license expiry date required'),
    body('date_joined').isDate().withMessage('Valid join date required'),
  ],

  attendance: [
    body('driver_id').isMongoId().withMessage('Valid Driver ID required'),
    body('date').isDate().withMessage('Valid date required'),
    body('status').isIn(['present', 'absent', 'leave', 'holiday']).withMessage('Invalid status'),
  ],

  fuel: [
    body('vehicle_id').isMongoId().withMessage('Valid Vehicle ID required'),
    body('date').isDate().withMessage('Valid date required'),
    body('fuel_quantity_liters').isFloat({ min: 0 }).withMessage('Valid fuel quantity required'),
    body('fuel_cost').isFloat({ min: 0 }).withMessage('Valid fuel cost required'),
  ],

  expense: [
    body('category').isIn(['fuel', 'maintenance', 'insurance', 'permit', 'tyres', 'other']),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
    body('date').isDate().withMessage('Valid date required'),
    body('vehicle_id').optional().isMongoId().withMessage('Valid Vehicle ID required'),
  ],

  maintenance: [
    body('vehicle_id').isMongoId().withMessage('Valid Vehicle ID required'),
    body('service_date').isDate().withMessage('Valid service date required'),
    body('service_type').trim().notEmpty().withMessage('Service type required'),
    body('cost').isFloat({ min: 0 }).withMessage('Valid cost required'),
  ],

  idParam: [
    param('id').isMongoId().withMessage('Valid ID required'),
  ],
};

module.exports = validators;

