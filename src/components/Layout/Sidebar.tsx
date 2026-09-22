// src/components/Layout/Sidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  BrainCircuit,
  CalendarCheck,
  BarChart3,
  Settings,
  ShieldCheck,
  ShieldAlert,
  GitCommit,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'positions'
  | 'new-trade'
  | 'timeline'
  | 'daily-review'
  | 'weekly-review'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activePositionsCount: number;
  isCircuitBreakerTriggered: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activePositionsCount,
  isCircuitBreakerTriggered,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: '今日概览',
      icon: LayoutDashboard,
      badge: isCircuitBreakerTriggered ? '风控' : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'positions' as NavTab,
      label: '持仓监控',
      icon: Briefcase,
      badge: activePositionsCount > 0 ? `${activePositionsCount}` : null,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'new-trade' as NavTab,
      label: '我要买入',
      icon: PlusCircle,
      highlight: true,
    },
    {
      id: 'timeline' as NavTab,
      label: '交易时间轴',
      icon: GitCommit,
    },
    {
      id: 'daily-review' as NavTab,
      label: '每日复盘',
      icon: BrainCircuit,
    },
    {
      id: 'weekly-review' as NavTab,
      label: '周度报告',
      icon: CalendarCheck,
    },
    {
      id: 'analytics' as NavTab,
      label: '纪律统计',
      icon: BarChart3,
    },
    {
      id: 'settings' as NavTab,
      label: '风控与数据',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#060911] border-r border-white/5 flex flex-col justify-between select-none">
      <div>
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            TG
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-sm tracking-tight text-white">
              TradeGuard
              <span className="text-[10px] font-mono font-medium px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                V1.0
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">交易守门员 · 纪律至上</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                } ${
                  item.highlight && !isActive
                    ? 'text-indigo-400 hover:text-indigo-300 font-semibold'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-indigo-400'
                        : item.highlight
                        ? 'text-indigo-400'
                        : 'text-zinc-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer status & principle */}
      <div className="p-4 border-t border-white/5 bg-[#080d18]/50">
        <div className="flex items-center gap-2 mb-2">
          {isCircuitBreakerTriggered ? (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>熔断模式开启</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>风控状态：正常</span>
            </div>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500 italic">
          “让买入时的自己监督持仓后的自己”
        </p>
      </div>
    </aside>
  );
};
