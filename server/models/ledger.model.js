import mongoose from 'mongoose';

const ledgerTransactionSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sale', 'commission_fee', 'payout', 'refund'],
      required: true,
    },
    // Amounts MUST be stored in the smallest currency unit (e.g., paise/cents) to avoid floating point math errors
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
      },
    },
    // Store the currency code for future multi-currency support
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'cleared', 'failed'],
      default: 'cleared',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'ledger_transactions' },
);

// Index for quickly calculating a seller's balance or fetching their history
ledgerTransactionSchema.index({ seller: 1, createdAt: -1 });
ledgerTransactionSchema.index({ order: 1 }); // Quick lookup by order

export const LedgerTransaction = mongoose.model('LedgerTransaction', ledgerTransactionSchema);
