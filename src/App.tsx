// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getSettings, DEFAULT_SETTINGS } from './db/database';
import { seedInitialData } from './db/seedData';
import { evaluateCircuitBreaker } from './utils/riskCalculator';

import { Layout } from './components/Layout/Layout';
import type { NavTab } from './components/Layout/Sidebar';

import { DashboardView } from './components/Dashboard/DashboardView';
import { PositionsView } from './components/Positions/PositionsView';
import { NewTradeView } from './components/NewTrade/NewTradeView';
import { StockTimeline } from './components/Timeline/StockTimeline';
import { DailyReviewView } from './components/Reviews/DailyReviewView';
import { WeeklyReviewView } from './components/Reviews/WeeklyReviewView';
import { DisciplineDashboard } from './components/Analytics/DisciplineDashboard';
import { SettingsView } from './components/Settings/SettingsView';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedTimelineId, setSelectedTimelineId] = useState<number | undefined>();
  const [initialized, setInitialized] = useState(false);

  // 初始化检查示范数据
  useEffect(() => {
    const init = async () => {
      try {
        await seedInitialData(false);
      } catch (err) {
        console.error('Seed error:', err);
      } finally {
        setInitialized(true);
      }
    };
    init();
  }, []);

  // 响应式订阅 Dexie IndexedDB
  const plans = useLiveQuery(() => db.tradePlans.toArray(), []) || [];
  const settings = useLiveQuery(() => getSettings(), []) || DEFAULT_SETTINGS;

  const activePositions = plans.filter((p) => p.status === 'ACTIVE');
  const circuitBreaker = evaluateCircuitBreaker(plans, settings);

  const handleViewTimeline = (planId: number) => {
    setSelectedTimelineId(planId);
    setCurrentTab('timeline');
  };

  const handleTradeCreated = (newPlanId: number) => {
    setSelectedTimelineId(newPlanId);
    setCurrentTab('positions');
  };

  const handleRefresh = () => {
    // LiveQuery will automatically update
  };

  if (!initialized) {
    return (
      <div className="h-screen w-screen bg-[#090d16] flex items-center justify-center text-zinc-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 animate-pulse" />
          <span>正在启动 TradeGuard 交易守门员引擎...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activePositionsCount={activePositions.length}
      isCircuitBreakerTriggered={circuitBreaker.isTriggered}
    >
      {currentTab === 'dashboard' && (
        <DashboardView
          plans={plans}
          settings={settings}
          onRefresh={handleRefresh}
          onNavigateTab={setCurrentTab}
          onViewTimeline={handleViewTimeline}
        />
      )}

      {currentTab === 'positions' && (
        <PositionsView
          plans={plans}
          onRefresh={handleRefresh}
          onNewTrade={() => setCurrentTab('new-trade')}
          onViewTimeline={handleViewTimeline}
        />
      )}

      {currentTab === 'new-trade' && (
        <NewTradeView
          settings={settings}
          onTradeCreated={handleTradeCreated}
        />
      )}

      {currentTab === 'timeline' && (
        <StockTimeline
          plans={plans}
          initialSelectedId={selectedTimelineId}
        />
      )}

      {currentTab === 'daily-review' && (
        <DailyReviewView plans={plans} />
      )}

      {currentTab === 'weekly-review' && (
        <WeeklyReviewView plans={plans} />
      )}

      {currentTab === 'analytics' && (
        <DisciplineDashboard
          plans={plans}
          settings={settings}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsView
          settings={settings}
          onRefresh={handleRefresh}
        />
      )}
    </Layout>
  );
};

export default App;
