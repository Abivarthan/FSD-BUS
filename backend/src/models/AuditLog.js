const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entity_id: { type: String }, // Keep string because entity ID could be various types/references
  old_values: { type: mongoose.Schema.Types.Mixed },
  new_values: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String }
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

auditLogSchema.virtual('log_id').get(function() {
  return this._id.toHexString();
});
auditLogSchema.set('toJSON', { virtuals: true });
auditLogSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
