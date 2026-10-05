import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Technical',
          'Cultural',
          'Sports',
          'Workshop',
          'Seminar',
          'Competition',
          'Other',
        ],
        message: '{VALUE} is not a valid event category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
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
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event organizer is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Event capacity is required'],
      min: [1, 'Capacity must be at least 1 seat'],
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        message: '{VALUE} is not a valid event status',
      },
      default: 'upcoming',
    },
    image: {
      type: String,
      default: '',
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to populate registrations count without embedding array
eventSchema.virtual('registrations', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
});

// Indexes for query optimization (ADBMS demonstration)
eventSchema.index({ date: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ title: 'text', description: 'text' }); // Full-text search index

const Event = mongoose.model('Event', eventSchema);

export default Event;
