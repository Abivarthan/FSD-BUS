const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  category: { type: String, enum: ['fuel', 'maintenance', 'insurance', 'permit', 'tyres', 'other'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String },
  receipt_number: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

expenseSchema.virtual('expense_id').get(function() {
  return this._id.toHexString();
});
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Expense', expenseSchema);
