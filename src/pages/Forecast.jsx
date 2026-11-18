import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Table as TableIcon, Loader2, Sparkles } from 'lucide-react';

export default function Forecast({ dataSource, forecastData, lastTimestamp = Date.now() }) {
  const [activeInterval, setActiveInterval] = useState('hourly_24h');
  const [visibleParams, setVisibleParams] = useState({ temp: true, ph: true, turb: true, do: true });

  // --- DATA PROCESSING ENGINE ---
  const data = useMemo(() => {
    // Check for explicit undefined to handle loading vs empty
    if (!forecastData || !forecastData['Surface Temperature']) return [];

    const tempNode = forecastData['Surface Temperature']?.[activeInterval];
    const phNode = forecastData['pH']?.[activeInterval];
    const turbNode = forecastData['Turbidity']?.[activeInterval];
    const doNode = forecastData['Dissolved Oxygen']?.[activeInterval];

    if (!tempNode) return [];

    const indices = Object.keys(tempNode).sort((a,b) => Number(a) - Number(b));

    return indices.map(i => {
      const index = Number(i);
      let displayLabel = `+${index+1}`; 
      
      let timeOffset = 0;
      if (activeInterval.includes('hourly')) {
          displayLabel += 'h';
          timeOffset = (index + 1) * 3600000;
      } else {
          displayLabel += 'd';
          timeOffset = (index + 1) * 86400000;
      }

      const futureDate = new Date(lastTimestamp + timeOffset);
      
      const fullDateStr = futureDate.toLocaleString([], {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: activeInterval.includes('hourly') ? '2-digit' : undefined,
          minute: activeInterval.includes('hourly') ? '2-digit' : undefined,
      });

      return {
        id: i,
        name: displayLabel,
        fullDate: fullDateStr, 
        temp_forecast: tempNode[i] ? Number(tempNode[i]) : null,
        ph_forecast: phNode && phNode[i] ? Number(phNode[i]) : null,
        turb_forecast: turbNode && turbNode[i] ? Number(turbNode[i]) : null,
        do_forecast: doNode && doNode[i] ? Number(doNode[i]) : null,
      };
    });
  }, [forecastData, activeInterval, lastTimestamp]);

  const toggleParam = (key) => setVisibleParams(prev => ({ ...prev, [key]: !prev[key] }));

  // --- LOADING STATE ---
  const isLoading = forecastData === undefined;
  const activeColCount = 1 + (visibleParams.do ? 1 : 0) + (visibleParams.temp ? 1 : 0) + (visibleParams.ph ? 1 : 0) + (visibleParams.turb ? 1 : 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dateStr = payload[0].payload.fullDate;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-200 shadow-xl rounded-xl text-xs z-50">
          <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">
            Forecast: <span className="text-violet-600">{dateStr}</span> ({label})
          </p>
          {payload.map((entry, index) => {
            if (entry.value == null) return null;
            return (
              <div key={index} className="flex items-center gap-2 mb-1" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span className="capitalize font-semibold">{entry.name}:</span>
                <span className="font-mono">{Number(entry.value).toFixed(2)}</span>
              </div>
            );
          })}
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
        
        {/* 1. HEADER (Compact) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-none">
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              Forecast Analytics
              {dataSource === 'real' && (
                <span className="relative flex h-2.5 w-2.5 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                </span>
              )}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">Projected trends based on historical data patterns.</p>
          </div>
          
          <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                {[
                  { label: 'Next 24H', key: 'hourly_24h' },
                  { label: 'Next 7D', key: 'daily_7d' },
                  { label: 'Next 30D', key: 'daily_30d' }
                ].map((item) => (
                    <button 
                    key={item.key} 
                    onClick={() => setActiveInterval(item.key)} 
                    className={`px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all uppercase whitespace-nowrap ${
                        activeInterval === item.key 
                        ? 'bg-white text-violet-600 shadow-sm' 
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
            {isLoading ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-400 animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    <span className="text-xs font-bold">Connecting to ML Engine...</span>
                </div>
            ) : data.length > 0 ? (
                <div className="flex-1 w-full flex flex-col min-h-0">
                    
                    {/* CHART HEADER */}
                    <div className="flex justify-between items-center mb-4 flex-none">
                        <h3 className="text-base font-bold text-slate-700">Forecast Trends</h3>

                        {/* PARAMETER TOGGLES */}
                        <div className="flex gap-1.5">
                            <button onClick={() => toggleParam('do')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.do ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.do ? 'bg-purple-500' : 'bg-slate-300'}`}></span>DO
                            </button>
                            <button onClick={() => toggleParam('temp')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.temp ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.temp ? 'bg-blue-500' : 'bg-slate-300'}`}></span>Temp
                            </button>
                            <button onClick={() => toggleParam('ph')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.ph ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.ph ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>pH
                            </button>
                            <button onClick={() => toggleParam('turb')} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${visibleParams.turb ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-200 opacity-60 hover:opacity-100'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${visibleParams.turb ? 'bg-amber-500' : 'bg-slate-300'}`}></span>Turbidity
                            </button>
                        </div>
                    </div>

                    {/* CHART GRAPH */}
                    <div className="flex-1 w-full min-h-0 relative">
                      <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradDo" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.2}/><stop offset="100%" stopColor="#a855f7" stopOpacity={0}/></linearGradient>
                                <linearGradient id="gradTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                                <linearGradient id="gradPh" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                <linearGradient id="gradTurb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} minTickGap={30} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={['auto', 'auto']} width={40} />
                            <Tooltip content={<CustomTooltip />} />
                            
                            {visibleParams.do && (
                              <>
                                <Line type="monotone" dataKey="do_forecast" name="DO Forecast" stroke="#a855f7" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                              </>
                            )}
                            {visibleParams.temp && (
                              <>
                                <Line type="monotone" dataKey="temp_forecast" name="Temperature Forecast" stroke="#3b82f6" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                              </>
                            )}
                            {visibleParams.ph && (
                              <>
                                <Line type="monotone" dataKey="ph_forecast" name="pH Level Forecast" stroke="#10b981" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                              </>
                            )}
                            {visibleParams.turb && (
                              <>
                                <Line type="monotone" dataKey="turb_forecast" name="Turbidity Forecast" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} activeDot={{r: 5}} />
                              </>
                            )}
                            </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                </div>
            ) : (
               <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                  <div className="text-xs font-medium italic">No forecast data available for this range.</div>
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
            <h3 className="text-sm font-bold text-blue-800">Forecast Insight</h3>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">
            Predictive modeling indicates stable trends over the selected forecast window. Anticipated temperature and DO levels remain within optimal thresholds. Monitor projected turbidity peaks to maintain ideal environmental conditions.
          </p>
        </div>

        {/* DATASET TABLE */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-none">
              <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800">Forecast Data Table</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
                  {data.length} Predictions
              </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1">
              <table className="w-full text-xs text-left text-slate-600 relative">
                  <thead className="text-[10px] text-slate-400 uppercase bg-white sticky top-0 z-10 shadow-sm">
                      <tr>
                          <th className="px-2 py-2">Projected Time</th>
                          {visibleParams.do && <th className="px-2 py-2">DO</th>}
                          {visibleParams.temp && <th className="px-2 py-2">°C</th>}
                          {visibleParams.ph && <th className="px-2 py-2">pH</th>}
                          {visibleParams.turb && <th className="px-2 py-2">NTU</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {data.length > 0 ? (
                          data.map((row) => (
                              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-2 py-2 font-medium text-slate-900 whitespace-nowrap text-[11px]">
                                      {row.fullDate} <span className="text-slate-400 text-[10px] ml-1">({row.name})</span>
                                  </td>
                                  
                                  {visibleParams.do && (
                                      <td className="px-2 py-2 text-purple-600 font-mono text-[11px]">
                                          {row.do_forecast !== null ? row.do_forecast.toFixed(2) : '--'}
                                      </td>
                                  )}

                                  {visibleParams.temp && (
                                      <td className="px-2 py-2 text-blue-600 font-mono text-[11px]">
                                          {row.temp_forecast !== null ? row.temp_forecast.toFixed(2) : '--'}
                                      </td>
                                  )}
                                  
                                  {visibleParams.ph && (
                                      <td className="px-2 py-2 text-emerald-600 font-mono text-[11px]">
                                          {row.ph_forecast !== null ? row.ph_forecast.toFixed(2) : '--'}
                                      </td>
                                  )}
                                  
                                  {visibleParams.turb && (
                                      <td className="px-2 py-2 text-amber-600 font-mono text-[11px]">
                                          {row.turb_forecast !== null ? row.turb_forecast.toFixed(2) : '--'}
                                      </td>
                                  )}
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan={activeColCount} className="px-2 py-6 text-center text-slate-400 italic">
                                  {isLoading ? 'Loading forecast...' : 'No forecast data available.'}
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