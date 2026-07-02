import { LedgerTransaction } from '../models/ledger.model.js';
import { asyncHandler, ApiResponse } from '../utils/helpers.js';

/**
 * @desc    Get seller's billing dashboard data (Balance & Ledger)
 * @route   GET /api/v3/billing/my-ledger
 * @access  Private/Seller
 */
export const getMyLedger = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  // 1. Fetch all cleared ledger transactions (Limiting to 1000 to prevent Memory OOM on large sellers)
  const transactions = await LedgerTransaction.find({ seller: sellerId })
    .populate('order', 'orderNumber status')
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();

  // 2. Calculate Balances
  // We calculate totals by type (all amounts are in paise)
  let totalSalesPaise = 0;
  let totalFeesPaise = 0;
  let totalPayoutsPaise = 0;
  let totalRefundsPaise = 0;

  transactions.forEach(tx => {
    if (tx.status === 'cleared' || tx.status === 'pending') { // For now treat pending COD as cleared for balance display, or separate them.
      // Let's separate "Available Balance" (cleared) vs "Pending" (COD usually)
      if (tx.type === 'sale') totalSalesPaise += tx.amount;
      if (tx.type === 'commission_fee') totalFeesPaise += tx.amount;
      if (tx.type === 'payout') totalPayoutsPaise += tx.amount;
      if (tx.type === 'refund') totalRefundsPaise += tx.amount;
    }
  });

  // Net Balance in Paise = Sum of all transaction amounts (since debits are negative, credits are positive)
  const netBalancePaise = totalSalesPaise + totalFeesPaise + totalPayoutsPaise + totalRefundsPaise;

  // Convert paise back to rupees for the frontend (or let frontend handle it)
  // Negate debits (which are negative) to show them as positive values in the dashboard summary
  const summary = {
    totalSales: totalSalesPaise / 100,
    totalFees: -totalFeesPaise / 100,
    totalPayouts: -totalPayoutsPaise / 100,
    netBalance: netBalancePaise / 100,
  };

  return res.status(200).json(new ApiResponse(200, {
    summary,
    transactions: transactions.map(tx => ({
      ...tx,
      amount: tx.amount / 100 // send human readable currency
    }))
  }, 'Ledger retrieved successfully'));
});
