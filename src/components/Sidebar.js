import React from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  BarChart3, 
  PlayCircle, 
  PlusCircle, 
  TrendingUp, 
  Brain,
  BookOpen
} from 'lucide-react';

const Sidebar = () => {
  const { currentView, navigate } = useApp();

  const menuItems = [
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'quiz', label: 'Teste', icon: PlayCircle },
    { id: 'create', label: 'Criar Questão', icon: PlusCircle },
    { id: 'prediction', label: 'Prever Desempenho', icon: TrendingUp },
    { id: 'retention', label: 'Análise de Retenção', icon: Brain },
  ];

  return (
    <aside className="w-64 bg-background border-r-2 border-primary/30 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-card">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">KnowMetrics</h1>
            <p className="text-primary text-xs">Quiz Analytics</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                w-full sidebar-link
                ${isActive ? 'sidebar-link-active' : ''}
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/20">
        <p className="text-white/50 text-xs text-center">
          Desenvolvido por Lui Loureiro
        </p>
        <p className="text-primary/50 text-xs text-center mt-1">
          v2.0.0 - React Edition
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
