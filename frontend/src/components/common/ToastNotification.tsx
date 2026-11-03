import React from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X 
} from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { activeToast, hideToast } = useAppStore();

  if (!activeToast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    danger: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 ${borders[activeToast.type]}`}>
        {icons[activeToast.type]}
        <div className="flex-1 text-sm">
          <h4 className="font-semibold">{activeToast.title}</h4>
          <p className="mt-0.5 opacity-90">{activeToast.message}</p>
        </div>
        <button 
          onClick={hideToast}
          className="opacity-70 hover:opacity-100 p-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
