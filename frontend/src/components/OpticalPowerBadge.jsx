// frontend/src/components/OpticalPowerBadge.jsx
import { Wifi, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';

export default function OpticalPowerBadge({ power, status, showText = true, size = 'md' }) {
  if (status === 'LOS' || (power !== null && power !== undefined && power < -28.0)) {
    return (
      <span
        title={`Critical Signal / Fiber Cut: ${power ? `${power} dBm` : 'Loss of Signal'}`}
        className={`inline-flex items-center gap-1 font-mono font-medium rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 ${
          size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400 animate-pulse" />
        <span>{power !== null && power !== undefined ? `${power} dBm` : 'LOS'}</span>
        {showText && <span className="text-[10px] uppercase font-bold opacity-80">(Critical)</span>}
      </span>
    );
  }

  if (power !== null && power !== undefined && power < -24.0) {
    return (
      <span
        title={`Warning - High Attenuation: ${power} dBm (Check fiber bends/splices)`}
        className={`inline-flex items-center gap-1 font-mono font-medium rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${
          size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>{power} dBm</span>
        {showText && <span className="text-[10px] uppercase font-bold opacity-80">(Warning)</span>}
      </span>
    );
  }

  if (power !== null && power !== undefined) {
    return (
      <span
        title={`Optimal Optical Signal: ${power} dBm`}
        className={`inline-flex items-center gap-1 font-mono font-medium rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${
          size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        <span>{power} dBm</span>
        {showText && <span className="text-[10px] uppercase font-bold opacity-80">(Good)</span>}
      </span>
    );
  }

  return (
    <span
      title="No optical power reading available"
      className={`inline-flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <XCircle className="w-3 h-3 text-slate-400" />
      <span>{status || '-'}</span>
    </span>
  );
}

