// src/components/Layout/Layout.tsx
import React from 'react';
import { Sidebar, type NavTab } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activePositionsCount: number;
  isCircuitBreakerTriggered: boolean;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  activePositionsCount,
  isCircuitBreakerTriggered,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-zinc-100">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        activePositionsCount={activePositionsCount}
        isCircuitBreakerTriggered={isCircuitBreakerTriggered}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onNewTradeClick={() => onSelectTab('new-trade')} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
