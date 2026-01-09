import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

const Notification = ({ message, type = 'info' }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning',
    info: 'bg-primary'
  };

  const Icon = icons[type] || icons.info;
  const bgColor = colors[type] || colors.info;

  return (
    <div className={`
      fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl 
      shadow-lg flex items-center gap-3 animate-slide-in z-50
      max-w-md
    `}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">{message}</span>
    </div>
  );
};

export default Notification;
