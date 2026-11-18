import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, ReferenceLine, Tooltip 
} from 'recharts';
import CircularGauge from './CircularGauge';
import { getDescriptiveAnalysis } from '../utils/helpers';

const dbKeys = { temp: 'Surface Temperature', ph: 'pH', turbidity: 'Turbidity', do: 'Dissolved Oxygen' };

const StatCard = ({ title, icon: Icon, baseDataConfig, config, type, liveData, dataSource, historyData = [], lastTimestamp, forecastData }) => {
  const [showHist, setShowHist] = useState(true);
  const [showFcst, setShowFcst] = useState(true);
  const [chartData, setChartData] = useState([]);

  const COLORS = {
    do: { actual: '#0ea5e9', forecast: '#7dd3fc', bg: '#f0f9ff' },
    temp: { actual: '#2563eb', forecast: '#93c5fd', bg: '#eff6ff' },
    ph: { actual: '#059669', forecast: '#6ee7b7', bg: '#ecfdf5' },
    turbidity: { actual: '#d97706', forecast: '#fcd34d', bg: '#fffbeb' }
  };

  const theme = COLORS[type] || COLORS.temp;
  const safeLiveData = isNaN(Number(liveData)) ? 0 : Number(liveData);

  const ONE_HOUR = 3600 * 1000;

  // --- FORECAST AVAILABILITY CHECK ---
  
  const hasForecast = dataSource === 'simulation' || Boolean(forecastData?.[dbKeys[type]]?.['hourly_24h']);

  // Auto-disable the forecast toggle if data is missing
  useEffect(() => {
    if (!hasForecast) setShowFcst(false);
  }, [hasForecast]);
  
  const getCustomTicks = (anchor) => [
    anchor - (24 * ONE_HOUR), anchor - (12 * ONE_HOUR), anchor, anchor + (12 * ONE_HOUR), anchor + (24 * ONE_HOUR)
  ];

  const formatTick = (val) => {
    const diffHours = (val - lastTimestamp) / ONE_HOUR;
    if (Math.abs(diffHours) < 0.1) return 'NOW';
    if (diffHours > 0) return `+${Math.round(diffHours)}h`;
    return `${Math.round(diffHours)}h`;
  };

  // --- GRAPH DATA MAPPING ---
  useEffect(() => {
    if (!lastTimestamp) return;

    const anchor = lastTimestamp;
    const processedPoints = [];

    if (dataSource === 'simulation' && historyData.length > 0) {
        const nowIndex = Math.floor(historyData.length / 2);
        historyData.forEach((item, index) => {
            const targetTime = anchor + ((index - nowIndex) * ONE_HOUR);
            processedPoints.push({
                x: targetTime,
                hist: index <= nowIndex ? item[type] : null,
                fcst: index >= nowIndex ? item[type] : null 
            });
        });
    } else {
        let lastValidValue = null;
        const preWindowData = historyData.filter(d => d.timestamp < anchor - (24 * ONE_HOUR));
        if (preWindowData.length > 0) lastValidValue = preWindowData[preWindowData.length - 1][type];

        for (let i = -24; i <= 0; i++) {
            const targetTime = anchor + (i * ONE_HOUR);
            const found = historyData.find(d => Math.abs(d.timestamp - targetTime) <= (ONE_HOUR / 2));
            if (found) lastValidValue = found[type];
            else if (i === 0 && safeLiveData !== undefined && dataSource === 'real') lastValidValue = safeLiveData;

            processedPoints.push({ x: targetTime, hist: lastValidValue, fcst: i === 0 ? lastValidValue : null });
        }

        const forecastArray = forecastData?.[dbKeys[type]]?.['hourly_24h'];

        if (dataSource === 'real') {
            if (forecastArray) {
                // Map real forecast data
                for (let i = 1; i <= 24; i++) {
                    const projectedVal = forecastArray[i - 1] !== undefined ? Number(forecastArray[i - 1]) : null;
                    processedPoints.push({ x: anchor + (i * ONE_HOUR), hist: null, fcst: projectedVal });
                }
            } else {
                // If real source but NO data exists, push NULL so the graph is completely empty
                for (let i = 1; i <= 24; i++) {
                    processedPoints.push({ x: anchor + (i * ONE_HOUR), hist: null, fcst: null });
                }
            }
        } else {
            // Simulation fallback
            let lastForecastVal = lastValidValue ?? safeLiveData ?? 0;
            for (let i = 1; i <= 24; i++) {
                const projected = lastForecastVal + ((Math.random() - 0.5) * (baseDataConfig.volatility || 1));
                lastForecastVal = projected;
                processedPoints.push({ x: anchor + (i * ONE_HOUR), hist: null, fcst: projected });
            }
        }
    }
    setChartData(processedPoints);
  }, [lastTimestamp, historyData, safeLiveData, type, baseDataConfig, dataSource, forecastData]);

  // --- DYNAMIC Y-AXIS CALCULATION ---
  const yAxisConfig = useMemo(() => {
    if (chartData.length === 0) return { domain: [0, 100], ticks: [0, 50, 100] };

    const visibleValues = chartData
      .flatMap(d => [(showHist ? d.hist : null), (showFcst ? d.fcst : null)])
      .filter(v => v != null);

    if (visibleValues.length === 0) return { domain: [0, 100], ticks: [0, 50, 100] };

    const dataMin = Math.min(...visibleValues);
    const dataMax = Math.max(...visibleValues);
    const minSpread = baseDataConfig.volatility || 1;
    const maxDiff = Math.max(Math.abs(safeLiveData - dataMin), Math.abs(dataMax - safeLiveData), minSpread);

    const yTop = safeLiveData + maxDiff;
    const yBottom = safeLiveData - maxDiff;

    return { domain: [yBottom, yTop], ticks: [yBottom, safeLiveData, yTop] };
  }, [chartData, safeLiveData, baseDataConfig, showHist, showFcst]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-xs z-50">
          <p className="font-bold text-slate-700 mb-1">{formatTick(label)} ({new Date(label).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</p>
          {payload.map((entry, index) => entry.value !== null && (
            <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="capitalize font-semibold">{entry.name}:</span>
              <span>{Number(entry.value).toFixed(2)} {config.unit}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-700 font-bold text-lg">{title}</h3>
        <div className="p-2 bg-slate-50 rounded-xl"><Icon className="text-slate-400 w-5 h-5" /></div>
      </div>
      
      <div className="flex-grow flex items-center justify-center">
        <CircularGauge value={safeLiveData} min={config.min} max={config.max} type={type} unit={config.unit} status={config.status} />
      </div>

      <div className="mt-4 mb-2 text-center min-h-[40px] flex items-end justify-center">
        <p className="text-sm font-medium text-slate-600 leading-relaxed px-2">
          {dataSource === 'real' && historyData.length === 0 ? 'Waiting for data stream...' : getDescriptiveAnalysis(type, safeLiveData)}
        </p>
      </div>

      {/* BUTTON CONTROLS */}
      <div className="flex gap-4 w-full justify-center mb-2 border-t border-slate-50 pt-3">
        <button 
          onClick={() => setShowHist(!showHist)} 
          style={{ backgroundColor: showHist ? theme.bg : 'white', color: showHist ? theme.actual : '#94a3b8', borderColor: showHist ? theme.actual : '#e2e8f0' }}
          className="flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: showHist ? theme.actual : '#cbd5e1' }}></span> Actual
        </button>
        
        {/* Forecast Button: Always clickable, but faded when no data exists */}
        <button 
          onClick={() => setShowFcst(!showFcst)} 
          style={{ 
              backgroundColor: showFcst ? theme.bg : 'white', 
              color: showFcst ? theme.forecast : '#94a3b8', 
              borderColor: showFcst ? theme.forecast : '#e2e8f0', 
              borderStyle: showFcst ? 'dashed' : 'solid',
              opacity: hasForecast ? 1 : 0.5 
          }}
          className="flex-1 flex justify-center items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border-2 transition-all cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full border-2 border-dashed" style={{ borderColor: showFcst ? theme.forecast : '#cbd5e1' }}></span> Forecast
        </button>
      </div>
      
      {/* CHART CONTAINER */}
      <div className="h-28 w-full flex items-center justify-center relative">
        
        {/* Overlay Badge when manually toggled ON but no data exists */}
        {showFcst && !hasForecast && (
            <div className="absolute top-0 right-2 bg-slate-50 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-200 z-10 shadow-sm animate-in fade-in duration-300">
                No forecast data
            </div>
        )}

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="x" type="number" axisLine={false} tickLine={false} 
                domain={[lastTimestamp - (24 * ONE_HOUR), lastTimestamp + (24 * ONE_HOUR)]}
                ticks={getCustomTicks(lastTimestamp)} tickFormatter={formatTick}
                tick={{fill: '#94a3b8', fontSize: 10}} allowDataOverflow={true} interval={0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                width={32} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                domain={yAxisConfig.domain} 
                ticks={yAxisConfig.ticks} 
                tickFormatter={(val) => val.toFixed(1)} 
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={lastTimestamp} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth={2} label={{ value: "NOW", position: 'top', fill: '#94a3b8', fontSize: 10, dy: -5 }} />
              
              {/* Removed hasForecast condition so it attempts to render null values (leaving an empty space) */}
              {showFcst && <Line type="monotone" dataKey="fcst" name="Forecast" stroke={theme.forecast} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 5, stroke: "white", strokeWidth: 2, fill: theme.forecast }} isAnimationActive={false} connectNulls={true} />}
              {showHist && <Line type="monotone" dataKey="hist" name="Actual" stroke={theme.actual} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "white", strokeWidth: 2, fill: theme.actual }} isAnimationActive={false} connectNulls={true} />}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-xs text-slate-300 font-medium italic">Graph unavailable</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;