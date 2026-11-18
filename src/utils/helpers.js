export const gradientStops = {
  do: [
    { p: 0.00, r: 255, g: 255, b: 255, a: 1 }, 
    { p: 1.00, r: 0, g: 153, b: 255, a: 1 }    
  ],
  temp: [
    { p: 0.0, r: 12, g: 103, b: 162, a: 1 }, 
    { p: 1.0, r: 238, g: 71, b: 46, a: 1 }
  ],
  ph: [
    { p: 0.00, r: 176, g: 28, b: 43, a: 1 },  
    { p: 0.10, r: 221, g: 58, b: 51, a: 1 },  
    { p: 0.20, r: 224, g: 202, b: 49, a: 1 }, 
    { p: 0.30, r: 53, g: 132, b: 68, a: 1 },  
    { p: 0.40, r: 31, g: 156, b: 209, a: 1 }, 
    { p: 0.50, r: 32, g: 142, b: 196, a: 1 }, 
    { p: 0.60, r: 36, g: 31, b: 94, a: 1 },   
    { p: 0.80, r: 94, g: 42, b: 136, a: 1 },  
    { p: 0.90, r: 135, g: 36, b: 132, a: 1 }, 
    { p: 1.00, r: 135, g: 36, b: 132, a: 1 }  
  ],
  turbidity: [
    { p: 0.00, r: 236, g: 231, b: 202, a: 0.15 }, 
    { p: 0.50, r: 170, g: 121, b: 65, a: 1.0 }, 
    { p: 1.00, r: 36, g: 17, b: 2, a: 1.0 }
  ]
};

export const getColorFromGradient = (value, min, max, stops) => {
  if (!stops || stops.length === 0) return 'rgba(200,200,200,1)';
  const safeValue = Math.min(Math.max(value, min), max);
  const percentage = (safeValue - min) / (max - min);
  for (let i = 0; i < stops.length - 1; i++) {
    if (percentage >= stops[i].p && percentage <= stops[i+1].p) {
      const range = stops[i+1].p - stops[i].p;
      const dist = (percentage - stops[i].p) / range;
      const r = Math.round(stops[i].r + (stops[i+1].r - stops[i].r) * dist);
      const g = Math.round(stops[i].g + (stops[i+1].g - stops[i].g) * dist);
      const b = Math.round(stops[i].b + (stops[i+1].b - stops[i].b) * dist);
      const a = stops[i].a + (stops[i+1].a - stops[i].a) * dist;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }
  const last = stops[stops.length - 1];
  return `rgba(${last.r}, ${last.g}, ${last.b}, ${last.a})`;
};

export const determineStatus = (type, value) => {
  if (type === 'do') {
    if (value < 3.0) return 'Critical';
    if (value < 5.0) return 'Poor';
    if (value <= 7.0) return 'Fair';
    if (value <= 10.0) return 'Good';
    return 'Excellent';
  }
  if (type === 'temp') {
    if (value < 20) return 'Cold';
    if (value < 25) return 'Cool';
    if (value <= 30) return 'Optimal';
    if (value <= 35) return 'Warm';
    return 'Hot';
  }
  if (type === 'ph') {
    if (value < 6.5) return 'Acidic';
    if (value <= 8.5) return 'Neutral';
    return 'Alkaline';
  }
  if (type === 'turbidity') {
    if (value <= 10) return 'Clear';
    if (value <= 30) return 'Cloudy';
    if (value <= 100) return 'Turbid';
    if (value <= 500) return 'High Turbidity';
    return 'Opaque';
  }
  return 'Unknown';
};

export const getStatusStyle = (status) => {
  if (!status) return 'bg-slate-100 text-slate-600 border-slate-200';
  const s = status.toLowerCase();
  
  if (['optimal', 'neutral', 'clear', 'excellent', 'good'].includes(s)) 
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  
  if (['cold', 'cool'].includes(s))
    return 'bg-blue-100 text-blue-800 border-blue-200';
    
  if (['alkaline'].includes(s))
    return 'bg-purple-100 text-purple-800 border-purple-200';

  if (['warm', 'cloudy', 'moderate', 'fair'].includes(s)) 
    return 'bg-amber-100 text-amber-800 border-amber-200';

  if (['hot', 'acidic', 'turbid', 'critical', 'danger', 'poor'].includes(s)) 
    return 'bg-rose-100 text-rose-800 border-rose-200';

  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export const getDescriptiveAnalysis = (type, value) => {
  if (type === 'do') {
    if (value < 5.0) return "Hypoxic conditions detected. High risk to aquatic life.";
    if (value <= 7.0) return "Moderate oxygen levels. Stressful for sensitive species.";
    return "Adequate dissolved oxygen for aquatic life.";
  }
  if (type === 'temp') {
    if (value < 20) return "Chemical reaction rates are slowed.";
    if (value > 30) return "Oxygen solubility is reduced.";
    return "Thermal conditions are stable.";
  }
  if (type === 'ph') {
    if (value < 6.5) return "Potential for corrosion or contaminant solubility.";
    if (value > 8.5) return "Risk of scaling or mineral deposits.";
    return "Chemical balance is stable.";
  }
  if (type === 'turbidity') {
    if (value > 25) return "Significant suspended solids detected.";
    if (value > 10) return "Water appears slightly cloudy.";
    return "Low particulate matter detected.";
  }
  return "Analyzing data...";
};

export const calculateWQI = (temp, ph, turbidity, doVal = 8) => {
  const qPh = 100 - (Math.abs(ph - 7.0) * 20); 
  const qTurb = Math.max(0, 100 - (turbidity * 2));
  const qTemp = 100 - (Math.abs(temp - 25.0) * 3);
  
  // Dissolved Oxygen: Optimal is > 7mg/L
  const qDo = doVal >= 7.0 ? 100 : Math.max(0, (doVal / 7.0) * 100);

  // Adjusted Weights: DO (0.3), pH (0.3), Turbidity (0.2), Temp (0.2)
  const wqi = (qDo * 0.3) + (qPh * 0.3) + (qTurb * 0.2) + (qTemp * 0.2);
  
  return Math.min(100, Math.max(0, Math.round(wqi)));
};