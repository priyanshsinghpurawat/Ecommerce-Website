import { LedgerTransaction } from '../models/ledger.model.js';
import { asyncHandler, ApiResponse } from '../utils/helpers.js';

/**
 * @desc    Get vendor's billing dashboard data (Balance & Ledger)
 * @route   GET /api/v3/billing/my-ledger
 * @access  Private/Seller
 */
export const getMyLedger = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  // 1. Fetch all cleared ledger transactions (Limiting to 1000 to prevent Memory OOM on large vendors)
  const transactions = await LedgerTransaction.find({ vendor: vendorId })
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
      if (tx.type === 'commission_fee') totalFeesPaise += Math.abs(tx.amount);
      if (tx.type === 'payout') totalPayoutsPaise += Math.abs(tx.amount);
      if (tx.type === 'refund') totalRefundsPaise += Math.abs(tx.amount);
    }
  });

  // Net Balance in Paise = Sales - Fees - Payouts - Refunds
  const netBalancePaise = totalSalesPaise - totalFeesPaise - totalPayoutsPaise - totalRefundsPaise;

  // Convert paise back to rupees for the frontend (or let frontend handle it)
  // Let's send both to prevent floating point issues on frontend
  const summary = {
    totalSales: totalSalesPaise / 100,
    totalFees: totalFeesPaise / 100,
    totalPayouts: totalPayoutsPaise / 100,
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
