import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Table as TableIcon, Play, Pause, Sparkles } from 'lucide-react';

export default function HistoricalData({ dataSource, historyData }) {
  const [range, setRange] = useState('24h');
  // Added 'do' to visible parameters
  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: true, turbidity: true, do: true });
  
  // --- LIVE DATA CONTROLS ---
  const [isLive, setIsLive] = useState(true);
  const [frozenDataset, setFrozenDataset] = useState([]);

  const activeDataset = isLive ? historyData : frozenDataset;

  const toggleLive = () => {
    if (isLive) {
      setFrozenDataset(historyData); 
      setIsLive(false);
    } else {
      setIsLive(true);
    }
  };

  // --- DATA FILTERING ENGINE ---
  const displayData = useMemo(() => {
    if (!activeDataset || activeDataset.length === 0) return [];
    
    if (range === 'all') {
         return activeDataset.map(item => ({
            ...item,
            displayTime: new Date(item.timestamp).toLocaleString(),
            fullDate: new Date(item.timestamp).toLocaleString()
        }));
    }

    const latestTime = activeDataset[activeDataset.length - 1].timestamp;
    let cutoff = latestTime;
    
    if (range === '24h') cutoff = latestTime - (24 * 60 * 60 * 1000);
    if (range === '7d') cutoff = latestTime - (7 * 24 * 60 * 60 * 1000);
    if (range === '30d') cutoff = latestTime - (30 * 24 * 60 * 60 * 1000);

    return activeDataset
      .filter(item => item.timestamp >= cutoff)
      .map(item => ({
        ...item,
        displayTime: range === '24h' 
          ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fullDate: new Date(item.timestamp).toLocaleString()
      }));

  }, [activeDataset, range]);

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  // Updated colspan calculation to include DO
  const activeColCount = 1 + (visibleParams.temp ? 1 : 0) + (visibleParams.ph ? 1 : 0) + (visibleParams.turbidity ? 1 : 0) + (visibleParams.do ? 1 : 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="capitalize font-semibold">{entry.name}:</span>
              <span className="font-mono">{Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      
      {/* ========================================== */}
      {/* LEFT COLUMN: Header & Chart                */}
      {/* ========================================== */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4 h-full min-h-0">
        
        {/* 1. HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-none">
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              Historical Data
              {dataSource === 'real' && (
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Review past sensor readings and identify trends.</p>
          </div>
          
          <div className="flex items-center gap-2">
              <button 
                  onClick={toggleLive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 ${
                      isLive 
                      ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                  }`}
              >
                  {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isLive ? "Pause" : "Resume"}
              </button>

              <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>

              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                {[
                    { label: '24h', key: '24h' },
                    { label: '7d', key: '7d' },
                    { label: '30d', key: '30d' },
                    { label: 'All', key: 'all' }
                ].map((item) => (
                    <button 
                    key={item.key} 
                    onClick={() => setRange(item.key)} 
                    className={`px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all uppercase whitespace-nowrap ${
                        range === item.key 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    >
                    {item.label}
                    </button>
                ))}
              </div>
          </div>
        </div>

        {/* 2. CHART AREA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
            {displayData.length > 0 ? (
                <div className="flex-1 w-full flex flex-col min-h-0">
                    
                    {/* CHART HEADER */}
                    <div className="flex justify-between items-center mb-4 flex-none">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-700">Overview Trends</h3>
                            {!isLive && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                                    Paused
                                </span>
                            )}
                        </div>

                        {/* PARAMETER TOGGLES */}
                        <div className="flex flex-wrap justify-end gap-1.5">
                            <button onClick={() => toggleParam('do')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.do ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.do ? 'bg-purple-500' : 'bg-slate-300'}`}></span>DO
                            </button>
                            <button onClick={() => toggleParam('temp')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.temp ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.temp ? 'bg-blue-500' : 'bg-slate-300'}`}></span>Temp
                            </button>
                            <button onClick={() => toggleParam('ph')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.ph ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.ph ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>pH
                            </button>
                            <button onClick={() => toggleParam('turbidity')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.turbidity ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.turbidity ? 'bg-amber-500' : 'bg-slate-300'}`}></span>Turbidity
                            </button>
                        </div>
                    </div>

                    {/* CHART GRAPH */}
                    <div className="flex-1 w-full min-h-0 relative">
                      <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={displayData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                <linearGradient id="colorDo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.1}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="displayTime" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} minTickGap={30} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={['auto', 'auto']} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            
                            {visibleParams.do && <Area type="monotone" dataKey="do" name="DO (mg/L)" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorDo)" isAnimationActive={false} />}
                            {visibleParams.temp && <Area type="monotone" dataKey="temp" name="Temperature (°C)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />}
                            {visibleParams.ph && <Area type="monotone" dataKey="ph" name="pH Level" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPh)" isAnimationActive={false} />}
                            {visibleParams.turbidity && <Area type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="#f59e0b" strokeWidth={2} fill="none" isAnimationActive={false} />}
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                </div>
            ) : (
               <div className="flex items-center justify-center flex-1 h-full">
                 <div className="text-slate-400 font-medium italic text-xs">Waiting for database connection...</div>
               </div>
            )}
        </div>
      </div>

      {/* ========================================== */}
      {/* RIGHT COLUMN: AI Insights & Dataset Table  */}
      {/* ========================================== */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 h-full min-h-0">
        
        {/* LIGHT BLUE AI INSIGHT BOX */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm flex-none">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-blue-800">AI Analytics Insight</h3>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            System analysis indicates standard operational stability. Temperature and pH levels are maintaining their expected baseline. Minor fluctuations detected in turbidity are currently within normal environmental variance limits.
          </p>
        </div>

        {/* DATASET TABLE */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-none">
              <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800">Dataset View</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
                  {displayData.length} Records
              </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1">
              <table className="w-full text-xs text-left text-slate-600 relative">
                  <thead className="text-[10px] text-slate-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-2 py-2">Timestamp</th>
                          {visibleParams.do && <th className="px-2 py-2">DO</th>}
                          {visibleParams.temp && <th className="px-2 py-2">°C</th>}
                          {visibleParams.ph && <th className="px-2 py-2">pH</th>}
                          {visibleParams.turbidity && <th className="px-2 py-2">NTU</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {displayData.length > 0 ? (
                          [...displayData].reverse().map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-2 py-2 font-medium text-slate-900 whitespace-nowrap text-[11px]">
                                      {row.displayTime}
                                  </td>
                                  
                                  {visibleParams.do && (
                                      <td className="px-2 py-2 text-purple-600 font-mono text-[11px]">
                                          {row.do ? row.do.toFixed(2) : '0.00'}
                                      </td>
                                  )}

                                  {visibleParams.temp && (
                                      <td className="px-2 py-2 text-blue-600 font-mono text-[11px]">
                                          {row.temp ? row.temp.toFixed(2) : '0.00'}
                                      </td>
                                  )}
                                  
                                  {visibleParams.ph && (
                                      <td className="px-2 py-2 text-emerald-600 font-mono text-[11px]">
                                          {row.ph ? row.ph.toFixed(2) : '0.00'}
                                      </td>
                                  )}
                                  
                                  {visibleParams.turbidity && (
                                      <td className="px-2 py-2 text-amber-600 font-mono text-[11px]">
                                          {row.turbidity ? row.turbidity.toFixed(2) : '0.00'}
                                      </td>
                                  )}
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan={activeColCount} className="px-2 py-6 text-center text-slate-400 italic">
                                  No data available.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
        </div>

      </div>

    </div>
  );
}