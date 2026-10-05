import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
      default: '',
    },
    room: {
      type: String,
      required: [true, 'Room designation is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Location capacity is required'],
      min: [1, 'Capacity must be at least 1 seat'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'denied'],
      default: 'active',
    },
    accessType: {
      type: String,
      enum: ['global', 'department'],
      default: 'global',
    },
    department: {
      type: String,
      enum: [
        'Computer Science',
        'Information Technology',
        'AI & Data Science',
        'Electronics',
        'Mechanical',
        'Civil',
        'MBA',
        'General',
      ],
      default: 'General',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ status: 1 });
locationSchema.index({ department: 1, accessType: 1 });
locationSchema.index({ name: 'text', building: 'text', room: 'text' });

const Location = mongoose.model('Location', locationSchema);

export default Location;
