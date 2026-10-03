import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password by default in queries
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'organizer', 'student'],
        message: '{VALUE} is not a valid role',
      },
      default: 'student',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
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
      default: 'Computer Science',
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Indexes for query optimization (ADBMS demonstration)
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ role: 1, department: 1 });

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
