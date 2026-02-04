function RevenueChart({ timeRange }) {
  // Mock data for revenue chart
  const data = {
    day: [
      { hour: '00:00', revenue: 120 },
      { hour: '04:00', revenue: 80 },
      { hour: '08:00', revenue: 450 },
      { hour: '12:00', revenue: 680 },
      { hour: '16:00', revenue: 890 },
      { hour: '20:00', revenue: 560 },
      { hour: '23:00', revenue: 340 }
    ],
    week: [
      { day: 'Mon', revenue: 4200 },
      { day: 'Tue', revenue: 5100 },
      { day: 'Wed', revenue: 4800 },
      { day: 'Thu', revenue: 6200 },
      { day: 'Fri', revenue: 7800 },
      { day: 'Sat', revenue: 8900 },
      { day: 'Sun', revenue: 6400 }
    ],
    month: [
      { week: 'Week 1', revenue: 28000 },
      { week: 'Week 2', revenue: 32000 },
      { week: 'Week 3', revenue: 29500 },
      { week: 'Week 4', revenue: 36000 }
    ],
    year: [
      { month: 'Jan', revenue: 98000 },
      { month: 'Feb', revenue: 105000 },
      { month: 'Mar', revenue: 112000 },
      { month: 'Apr', revenue: 108000 },
      { month: 'May', revenue: 125000 },
      { month: 'Jun', revenue: 132000 },
      { month: 'Jul', revenue: 128000 },
      { month: 'Aug', revenue: 135000 },
      { month: 'Sep', revenue: 142000 },
      { month: 'Oct', revenue: 138000 },
      { month: 'Nov', revenue: 145000 },
      { month: 'Dec', revenue: 152000 }
    ]
  };

  const chartData = data[timeRange];
  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  return (
    <div className="glass-card animate-fadeIn">
      <div className="flex justify-between items-center mb-lg">
        <h3 className="font-semibold">Revenue Trends</h3>
        <div className="flex items-center gap-sm">
          <div className="w-3 h-3 rounded-full" style={{ background: 'var(--gradient-cyber)' }}></div>
          <span className="text-sm text-secondary">Revenue</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: '320px', paddingBottom: '24px' }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-tertiary" style={{ width: '60px' }}>
          <span>${(maxRevenue / 1000).toFixed(0)}k</span>
          <span>${(maxRevenue * 0.75 / 1000).toFixed(0)}k</span>
          <span>${(maxRevenue * 0.5 / 1000).toFixed(0)}k</span>
          <span>${(maxRevenue * 0.25 / 1000).toFixed(0)}k</span>
          <span>$0</span>
        </div>

        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-12 flex items-end gap-sm" style={{ justifyContent: 'space-between' }}>
          {chartData.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;
            const label = item.hour || item.day || item.week || item.month;
            
            return (
              <div key={index} className="flex flex-col items-center" style={{ flex: '1 1 0', minWidth: '0' }}>
                {/* Bar */}
                <div className="w-full relative group cursor-pointer" style={{ display: 'flex', justifyContent: 'center' }}>
                  <div 
                    className="rounded-t-md transition-all"
                    style={{ 
                      width: '100%',
                      maxWidth: '60px',
                      height: `${height * 2.5}px`,
                      background: 'var(--gradient-cyber)',
                      opacity: 0.8
                    }}
                  >
                    {/* Tooltip - only visible on hover */}
                    <div 
                      className="absolute bottom-full left-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ 
                        whiteSpace: 'nowrap',
                        transform: 'translateX(-50%)',
                        zIndex: '1000'
                      }}
                    >
                      <div className="glass-card p-sm text-xs shadow-md">
                        <div className="font-semibold">${item.revenue.toLocaleString()}</div>
                        <div className="text-tertiary">{label}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* X-axis label with proper spacing */}
                <span className="text-xs text-tertiary" style={{ marginTop: '12px', display: 'block', textAlign: 'center' }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Grid lines */}
        <div className="absolute left-16 right-0 top-0 bottom-12 pointer-events-none">
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute left-0 right-0"
              style={{
                bottom: `${percent}%`,
                borderTop: '1px dashed var(--glass-border)',
                opacity: 0.3
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-md mt-lg pt-lg" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="text-center">
          <div className="text-xs text-secondary mb-xs">Total Revenue</div>
          <div className="font-bold text-lg text-gradient">
            ${chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-secondary mb-xs">Average</div>
          <div className="font-bold text-lg" style={{ color: 'var(--accent-cyan)' }}>
            ${Math.round(chartData.reduce((sum, item) => sum + item.revenue, 0) / chartData.length).toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-secondary mb-xs">Peak</div>
          <div className="font-bold text-lg" style={{ color: 'var(--accent-green)' }}>
            ${maxRevenue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;
