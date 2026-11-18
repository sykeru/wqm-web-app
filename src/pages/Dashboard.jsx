import React from 'react';
import StatCard from '../components/StatCard'; 
import WQICard from '../components/WQICard'; 

const Dashboard = ({ metrics, liveValues, dataSource, historyData, lastUpdated, forecastData }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Main Grid: Updated to 4 columns to fit all parameters on a single row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <StatCard
            key={index}
            title={metric.title}
            icon={metric.icon}
            type={metric.type}
            baseDataConfig={metric.baseDataConfig}
            config={metric.config}
            liveData={liveValues?.[metric.type] ?? 0}
            dataSource={dataSource}
            historyData={historyData}
            lastTimestamp={lastUpdated}
            forecastData={forecastData} // <-- Add this line
          />
        ))}
      </div>

      {/* Footer / WQI Section */}
      <div className="mt-6 pt-6 border-t border-slate-200">
         <WQICard liveValues={liveValues} />
      </div>

    </div>
  );
};

export default Dashboard;