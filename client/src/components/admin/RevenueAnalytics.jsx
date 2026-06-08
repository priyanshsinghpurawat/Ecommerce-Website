import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';

/**
 * RevenueAnalytics Component
 * Visualizes store performance data using Recharts.
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-lux-panel border border-border-base p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black italic text-lux-primary tracking-tighter">
          ₹{payload[0].value.toLocaleString('en-IN')}
        </p>
        {payload[1] && (
          <p className="text-[9px] font-bold text-lux-dark/60 mt-1 uppercase tracking-tighter">
            {payload[1].value} Orders
          </p>
        )}
      </div>
    );
  }
  return null;
};

const RevenueAnalytics = ({ data }) => {
  const { dailyRevenue = [], categoryPerformance = [], peakHours = [] } = data;

  // Format daily revenue for line chart
  const revenueData = dailyRevenue.map(item => ({
    name: new Date(item._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    revenue: item.revenue,
    orders: item.orders
  }));

  // Format peak hours (fill missing hours with 0)
  const fullPeakHours = Array.from({ length: 24 }, (_, i) => {
    const existing = peakHours.find(h => h._id === i);
    return {
      hour: `${i}:00`,
      count: existing ? existing.count : 0
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* 1. Main Revenue Trend (Line/Area Chart) */}
      <div className="bg-lux-card rounded-[2.5rem] p-8 border border-border-base shadow-soft col-span-1 lg:col-span-2">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-lux-dark italic">Revenue <span className="text-lux-primary">Analytics</span></h3>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Daily store performance · Last 30 Days</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lux-primary shadow-[0_0_8px_rgba(193,255,0,0.5)]" />
                <span className="text-[9px] font-black uppercase text-muted">Revenue</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lux-accent-cyan shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                <span className="text-[9px] font-black uppercase text-muted">Orders</span>
             </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c1ff00" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#c1ff00" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#737373' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#737373' }} 
                tickFormatter={(val) => `₹${val/1000}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#c1ff00" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                animationDuration={2000}
              />
              <Area 
                type="monotone" 
                dataKey="orders" 
                stroke="#00f0ff" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorOrders)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Top-Selling Subcategories (Bar Chart) */}
      <div className="bg-lux-card rounded-[2.5rem] p-8 border border-border-base shadow-soft">
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-lux-dark italic">Top <span className="text-lux-primary">Categories</span></h3>
          <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Best performing sub-niches</p>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryPerformance} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                dataKey="_id" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 800, fill: '#faffeb' }}
                width={80}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-lux-panel border border-border-base px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                        ₹{payload[0].value.toLocaleString()}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={12}>
                {categoryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#c1ff00' : '#2d2d2d'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Peak Ordering Hours */}
      <div className="bg-lux-card rounded-[2.5rem] p-8 border border-border-base shadow-soft">
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-lux-dark italic">Peak <span className="text-lux-primary">Hours</span></h3>
          <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-1">Customer activity heatmap</p>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fullPeakHours}>
              <XAxis 
                dataKey="hour" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 7, fontWeight: 700, fill: '#737373' }}
                interval={3}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-lux-panel border border-border-base px-2 py-1 rounded-lg text-[8px] font-black uppercase">
                        {payload[0].value} Orders
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#c1ff00" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default RevenueAnalytics;
