import mongoose from 'mongoose';

const migrationCheckpointSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
    },
    lastProductId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'rolled_back'],
      default: 'pending',
    },
    totalProducts: {
      type: Number,
      default: 0,
    },
    processedProducts: {
      type: Number,
      default: 0,
    },
    totalVariants: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'migration_checkpoints' },
);

export const MigrationCheckpoint = mongoose.model('MigrationCheckpoint', migrationCheckpointSchema);
