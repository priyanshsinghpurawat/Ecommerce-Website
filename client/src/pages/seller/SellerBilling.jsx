import { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { toast } from 'react-hot-toast';
import { IndianRupee, ArrowUpRight, ArrowDownRight, Wallet, Receipt, Loader2, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers.js';

export const SellerBilling = () => {
  const [data, setData] = useState({ summary: null, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await api.get('/billing/my-ledger');
        setData(res.data.data);
      } catch (error) {
        toast.error('Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };
    fetchLedger();
  }, []);

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-brand-primary" /></div>;
  }

  const { summary, transactions } = data;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-app-text italic">Financial <span className="text-brand-primary">Ledger</span></h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Track your revenue, platform fees, and payouts.</p>
        </div>
        <button
          onClick={async () => {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || '';
              const baseUrl = apiUrl ? apiUrl.replace(/\/api\/v3\/?$/, '') : window.location.origin;
              const token = localStorage.getItem('authToken');
              const response = await fetch(`${baseUrl}/api/v3/billing/my-ledger/export/xlsx`, {
                headers: {
                  'Authorization': token ? `Bearer ${token}` : ''
                }
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `billing_statement_${new Date().toISOString().slice(0,10)}.xlsx`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success('Statement downloaded successfully');
            } catch (err) {
              console.error('Statement download error:', err);
              toast.error('Failed to download statement. Please try again.');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-surface-100 text-app-text border border-border-base rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-brand-primary transition-all shadow-sm cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Download Statement
        </button>
      </div>

      {/* --- Stat Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Net Balance (Available) */}
        <div className="bg-brand-primary/10 border border-brand-primary/20 p-6 rounded-[2rem] shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500 text-brand-primary">
            <Wallet className="w-12 h-12" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2 flex items-center gap-2">
            Net Balance
          </p>
          <div className="flex items-end gap-3 relative z-10">
            <h3 className="text-4xl font-black tracking-tighter italic text-app-text">
              {formatCurrency(summary.netBalance)}
            </h3>
          </div>
          <p className="text-[10px] font-bold text-app-text/60 mt-3">Next payout on 1st of month</p>
        </div>

        {/* Gross Sales */}
        <div className="bg-app-card border border-border-base p-6 rounded-[2rem] shadow-soft hover:border-brand-primary/30 transition-colors">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
            Gross Sales
          </p>
          <h3 className="text-3xl font-black tracking-tighter italic text-app-text text-success flex items-center gap-2">
            <ArrowUpRight className="h-6 w-6" />
            {formatCurrency(summary.totalSales)}
          </h3>
        </div>

        {/* Platform Fees */}
        <div className="bg-app-card border border-border-base p-6 rounded-[2rem] shadow-soft hover:border-brand-primary/30 transition-colors">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
            Platform Fees (10%)
          </p>
          <h3 className="text-3xl font-black tracking-tighter italic text-app-text text-error flex items-center gap-2">
            <ArrowDownRight className="h-6 w-6" />
            {formatCurrency(summary.totalFees)}
          </h3>
        </div>

        {/* Total Payouts */}
        <div className="bg-app-card border border-border-base p-6 rounded-[2rem] shadow-soft hover:border-brand-primary/30 transition-colors">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
            Total Payouts
          </p>
          <h3 className="text-3xl font-black tracking-tighter italic text-app-text flex items-center gap-2">
            <Receipt className="h-6 w-6 text-muted" />
            {formatCurrency(summary.totalPayouts)}
          </h3>
        </div>
      </div>

      {/* --- Transactions Ledger --- */}
      <div className="bg-app-card border border-border-base rounded-[2.5rem] shadow-soft overflow-hidden">
        <div className="p-6 md:p-8 border-b border-border-base flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-app-text italic">Recent Transactions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-100 border-b border-border-base text-[10px] font-black text-muted uppercase tracking-widest">
                <th className="p-6 whitespace-nowrap">Date</th>
                <th className="p-6">Description</th>
                <th className="p-6">Type</th>
                <th className="p-6">Order #</th>
                <th className="p-6 text-right">Amount</th>
                <th className="p-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-muted font-bold text-xs uppercase tracking-widest">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-surface-100/50 transition-colors">
                    <td className="p-6 text-xs text-muted font-medium whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-bold text-app-text uppercase tracking-wider">{tx.description}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-2 py-1 rounded-[0.25rem] text-[9px] font-black uppercase tracking-widest border ${
                        tx.type === 'sale' ? 'bg-success/10 text-success border-success/20' : 
                        tx.type === 'commission_fee' ? 'bg-error/10 text-error border-error/20' :
                        tx.type === 'payout' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' :
                        'bg-surface-200 text-muted border-border-base'
                      }`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6 text-xs text-app-text/70 font-mono">
                      {tx.order?.orderNumber || '-'}
                    </td>
                    <td className={`p-6 text-sm font-black text-right tracking-tight italic ${tx.amount < 0 ? 'text-error' : 'text-success'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td className="p-6 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        tx.status === 'cleared' ? 'bg-success/10 text-success border-success/20' :
                        tx.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                        'bg-error/10 text-error border-error/20'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
