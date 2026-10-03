import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['registered', 'cancelled'],
        message: '{VALUE} is not a valid registration status',
      },
      default: 'registered',
    },
    attendance: {
      type: String,
      enum: {
        values: ['pending', 'present', 'absent'],
        message: '{VALUE} is not a valid attendance status',
      },
      default: 'pending',
    },
    feedback: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// UNIQUE Compound Index (ADBMS demonstration):
// Enforces that a student can only have ONE registration document per event!
// State transitions (registered <-> cancelled) modify the existing document.
registrationSchema.index({ student: 1, event: 1 }, { unique: true });

// Additional indexes for fast lookups and aggregations
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ student: 1, status: 1 });
registrationSchema.index({ attendance: 1 });
registrationSchema.index({ rating: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
