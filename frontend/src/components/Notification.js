import React from 'react';
import { useApp } from '../contexts/AppContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const Notification = () => {
  const { notification } = useApp();

  if (!notification) return null;

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning',
    info: 'bg-primary'
  };

  const Icon = icons[notification.type] || Info;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50 
      ${colors[notification.type] || colors.info}
      text-white px-4 py-3 rounded-xl shadow-lg
      flex items-center gap-3 animate-slide-up
      max-w-md
    `}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{notification.message}</span>
    </div>
  );
};

export default Notification;
