import React from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  BarChart3, 
  Play, 
  PlusCircle, 
  TrendingUp, 
  Brain,
  Sparkles,
  Upload
} from 'lucide-react';

const Sidebar = () => {
  const { currentPage, navigateTo } = useApp();

  const menuItems = [
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'quiz', label: 'Start Quiz', icon: Play },
    { id: 'create', label: 'Create Question', icon: PlusCircle },
    { id: 'import', label: 'Import Questions', icon: Upload },
    { id: 'prediction', label: 'Performance', icon: TrendingUp },
    { id: 'retention', label: 'Retention', icon: Brain },
    { id: 'prompt', label: 'Generate Prompt', icon: Sparkles },
  ];

  return (
    <aside className="w-56 bg-background border-r-2 border-primary flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center justify-center border-b border-primary/30">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={`
                w-full px-4 py-3 flex items-center gap-3 transition-all
                ${isActive 
                  ? 'bg-primary text-white' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'}
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 text-center border-t border-primary/30">
        <p className="text-white/50 text-xs">
          Developed by Lui Loureiro
        </p>
        <p className="text-primary text-xs mt-1">
          KnowMetrics v2.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
