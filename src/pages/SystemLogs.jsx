import React from 'react';
import { Terminal, Database, Code, BrainCircuit, Trash2 } from 'lucide-react';

export default function SystemLogs({ logs, dataSource, forecastData, onClearData }) {
  
  return (
    // Outer container locked to screen height
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      
      {/* 1. HEADER (Compact White Box) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-none">
        <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-extrabold text-slate-800">Input Data (Raw Logs)</h2>
        </div>

        {/* CLEAR DATA BUTTON (Only for Simulation) */}
        {dataSource === 'simulation' && (
            <button 
                onClick={onClearData}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs hover:bg-rose-100 transition-colors shadow-sm"
            >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Simulated Data
            </button>
        )}
      </div>

      {/* 2. TWO-COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* LEFT COLUMN: SENSOR LOGS CARD (Now 3/4 width) */}
        <div className="w-full lg:w-3/5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-none">
             <div className="flex items-center gap-2">
               <Database className="w-4 h-4 text-blue-500" />
               <span className="font-bold text-slate-700 text-sm">Database Retrieval Stream</span>
             </div>
             <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
               {logs.length} records
             </span>
          </div>

          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col flex-1 min-h-0">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center flex-none">
               <span className="text-[10px] font-mono text-slate-400">/RiverMonitor/History</span>
               <Code className="w-3 h-3 text-slate-500" />
            </div>
            
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-emerald-400 space-y-1.5 custom-scrollbar">
               {logs.length === 0 ? (
                 <div className="text-slate-500 italic text-center mt-10">Waiting for data stream...</div>
               ) : (
                 [...logs].reverse().map((log) => (
                   <div key={log.id} className="border-b border-slate-800/50 pb-1.5 hover:bg-slate-800/30 whitespace-nowrap pr-4">
                     <span className="text-blue-400">ID: {log.id}</span>
                     <span className="text-slate-500 mx-2">|</span>
                     <span className="text-amber-300">TS: {log.timestamp}</span>
                     <br/>
                     <span className="text-slate-300 ml-4">
                       {JSON.stringify(log.raw || {do: log.do, temp: log.temp, ph: log.ph, turb: log.turbidity})}
                     </span>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FORECAST DATA CARD (Now 1/4 width) */}
        <div className="w-full lg:w-2/5 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-none">
             <div className="flex items-center gap-2">
               <BrainCircuit className="w-4 h-4 text-violet-500" />
               <span className="font-bold text-slate-700 text-sm">Raw Forecast Object</span>
             </div>
             <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500">
               JSON
             </span>
          </div>

          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner flex flex-col flex-1 min-h-0">
            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center flex-none">
               <span className="text-[10px] font-mono text-slate-400">/RiverMonitor/Forecasts/data</span>
               <Code className="w-3 h-3 text-slate-500" />
            </div>
            
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-violet-300 custom-scrollbar">
               {forecastData ? (
                 <pre className="whitespace-pre pr-4">
                   {JSON.stringify(forecastData, null, 2)}
                 </pre>
               ) : (
                 <div className="text-slate-500 italic text-center mt-10">No forecast data available.</div>
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}