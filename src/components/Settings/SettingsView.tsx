// src/components/Settings/SettingsView.tsx
import React, { useState } from 'react';
import type { AccountSettings } from '../../types';
import { updateSettings } from '../../db/database';
import {
  exportAllDataToJSON,
  importDataFromJSON,
  exportTradesToCSV,
} from '../../utils/exportImport';
import { seedInitialData } from '../../db/seedData';
import {
  Settings,
  ShieldAlert,
  Download,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Database,
  Lock,
  Save,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AccountSettings;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefresh,
}) => {
  const [formData, setFormData] = useState<AccountSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      onRefresh();
      alert('风控与熔断参数已成功更新！');
    } catch (err) {
      console.error(err);
      alert('保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await importDataFromJSON(file);
      alert(res.message);
      if (res.success) {
        onRefresh();
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleResetDemoData = async () => {
    if (window.confirm('确定要重新载入全套实战示范数据吗？这将覆盖当前本地记录。')) {
      await seedInitialData(true);
      onRefresh();
      alert('已成功重置为标准示范数据！');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* 顶部标题 */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1">
          <Settings className="w-4 h-4" />
          <span>系统参数与风控底线</span>
          <span className="text-zinc-600">·</span>
          <span>离线安全</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          风控熔断器设置与本地数据管理
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          设定您的绝对风险底线。TradeGuard 将在您触及边界时强制点亮熔断红灯。
        </p>
      </div>

      {/* 数据安全声明横幅 (PRD Section 4) */}
      <div className="tg-card rounded-2xl p-5 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 to-[#0a0e1a] space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
          <Lock className="w-4 h-4" />
          <span>本地数据隐私安全声明</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          TradeGuard 无需注册、无需登录、没有后端云数据库。所有交易计划与复盘数据
          <strong className="text-white font-medium"> 默认 100% 仅保存在您当前浏览器的 IndexedDB 数据库中</strong>。
          绝无泄露风险。清除浏览器缓存可能导致数据丢失，请务必养成定期导出 JSON 备份的良好习惯！
        </p>
      </div>

      {/* 模块 1: 账户级熔断器配置 (PRD Section 18) */}
      <form onSubmit={handleSaveSettings} className="tg-card rounded-2xl p-6 border border-white/5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>账户级熔断器参数配置</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            当实际操作触发以下任意一项时，主页自动开启 🔴 风险模式
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              单笔最大允许账户风险 (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="20"
              value={formData.maxSingleRiskPercent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxSingleRiskPercent: parseFloat(e.target.value) || 2.0,
                })
              }
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              默认 2.0%。单只标的建仓时若 仓位 × 最大亏损 超过该值立即预警。
            </span>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              连续亏损交易笔数熔断阈值
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxConsecutiveLosses}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxConsecutiveLosses: parseInt(e.target.value) || 3,
                })
              }
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              默认 3 笔。连续亏损达到该数量时，强制要求停机复盘，暂停新增。
            </span>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              连续计划外交易笔数熔断阈值
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.maxConsecutiveUnplanned}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxConsecutiveUnplanned: parseInt(e.target.value) || 2,
                })
              }
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              默认 2 笔。出现 2 次冲动/未计划交易，代表情绪处于高危失控状态。
            </span>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              单周最大回撤承受线 (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="30"
              value={formData.maxWeeklyDrawdownPercent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxWeeklyDrawdownPercent: parseFloat(e.target.value) || 6.0,
                })
              }
              className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              默认 6.0%。近 7 天累计账户回撤超标时阻断无序建仓。
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-white/5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? '保存中...' : '保存风控规则'}</span>
          </button>
        </div>
      </form>

      {/* 模块 2: 数据备份与导出 (PRD Section 4) */}
      <div className="tg-card rounded-2xl p-6 border border-white/5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>数据备份、恢复与导出</span>
          </div>
          <span className="text-[11px] text-zinc-500">
            支持完整 JSON 跨设备恢复及 Excel/CSV 财务审计
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* JSON 备份 */}
          <button
            onClick={exportAllDataToJSON}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-start gap-2 text-left group"
          >
            <Download className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">导出完整 JSON 备份</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                包含全部交易、事件流、复盘与设置
              </div>
            </div>
          </button>

          {/* CSV 导出 */}
          <button
            onClick={exportTradesToCSV}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-start gap-2 text-left group"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">导出 CSV 交易台账</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                格式化表格，兼容 Excel/Numbers
              </div>
            </div>
          </button>

          {/* JSON 恢复 */}
          <label className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all flex flex-col items-start gap-2 text-left group cursor-pointer">
            <Upload className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-bold text-white">
                {importing ? '正在解析导入...' : '从 JSON 恢复数据'}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                选取历史备份文件一键还原
              </div>
            </div>
            <input
              type="file"
              accept=".json"
              disabled={importing}
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {/* 演示数据重置 */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-zinc-300">
              重置实战示范案例数据
            </div>
            <div className="text-[11px] text-zinc-500">
              一键填充西部数据(产业)、中际旭创(错配提醒)、拓维信息(短线超期)、许继电气(好交易亏损)等典型样本
            </div>
          </div>

          <button
            onClick={handleResetDemoData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 text-xs font-medium border border-white/10 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>重新加载演示数据</span>
          </button>
        </div>
      </div>
    </div>
  );
};
