'use client';

import { useState, useCallback, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';

interface StrategyTask {
  readonly id: string;
  readonly text: string;
  readonly month: number;
}

const MONTH_1_TASKS: readonly StrategyTask[] = [
  { id: 'm1-1', text: 'Create/optimize Byondwalls XHS account with full bio', month: 1 },
  { id: 'm1-2', text: 'Post 4x/week consistently for 30 days (16 total posts)', month: 1 },
  { id: 'm1-3', text: 'First 3 posts must use "hidden gem" framing (隐藏, 宝藏, 没人知道)', month: 1 },
  { id: 'm1-4', text: 'Contact all Tier C KOCs (micro, 100–500 likes): target 8 visits in month 1', month: 1 },
  { id: 'm1-5', text: 'Install photo corner + QR code table tents', month: 1 },
  { id: 'm1-6', text: 'Set up branded hashtag #撞墙BW', month: 1 },
  { id: 'm1-7', text: 'DM 挑吃Kris and 家杏吃玩日记 for Month 2 visit', month: 1 },
];

const MONTH_2_TASKS: readonly StrategyTask[] = [
  { id: 'm2-1', text: '挑吃Kris or equivalent pizza KOL posts about BW', month: 2 },
  { id: 'm2-2', text: 'melxeats SS2 specialist posts about BW', month: 2 },
  { id: 'm2-3', text: '干饭仔 date-night vibe post featuring BW', month: 2 },
  { id: 'm2-4', text: 'Host first KOC Media Night (8–12 creators, one evening)', month: 2 },
  { id: 'm2-5', text: 'Launch 隐藏菜单 item #1 — create 2 posts around it', month: 2 },
  { id: 'm2-6', text: 'Post 4x/week, now mix in 1 date-night post per week', month: 2 },
];

const MONTH_3_TASKS: readonly StrategyTask[] = [
  { id: 'm3-1', text: 'Shuan (9,978 likes) or 路小橙的游乐场 (7,328 likes) collab for KL must-eat list', month: 3 },
  { id: 'm3-2', text: 'Song2813 (9,297 likes) Italian/western food feature', month: 3 },
  { id: 'm3-3', text: '小鱼噜 (4,155 likes) itinerary feature: "48h in KL" → BW as a stop', month: 3 },
  { id: 'm3-4', text: 'Launch customer loyalty loop: show XHS post = 9% off', month: 3 },
  { id: 'm3-5', text: 'Track reservation source: ask every new customer "how did you find us?"', month: 3 },
];

const IMMEDIATE_TASKS: readonly StrategyTask[] = [
  { id: 'now-1', text: 'Post 5 times this week using the title formulas — seed "SS2手工披萨" and "PJ隐藏" keywords', month: 0 },
  { id: 'now-2', text: 'DM 挑吃Kris and melxeats today — highest-priority KOCs', month: 0 },
  { id: 'now-3', text: 'Book a KOC Media Night this month — invite 8 micro-KOCs for free dinner (~RM480)', month: 0 },
  { id: 'now-4', text: 'Put #撞墙BW on every single post, receipt, and table card', month: 0 },
  { id: 'now-5', text: 'Film a cheese-pull video this week — post at 12:30pm Tuesday', month: 0 },
];

const ALL_TASKS = [...IMMEDIATE_TASKS, ...MONTH_1_TASKS, ...MONTH_2_TASKS, ...MONTH_3_TASKS];

const CONTENT_PILLARS = [
  { name: 'Product Showcase', pct: '35%', desc: 'Cheese pull, flatlay, BTS dough making', color: 'bg-red-900/50 border-red-700' },
  { name: 'Hidden Gem / 隐藏宝藏', pct: '25%', desc: 'SS2 secret spot framing — avg 2,877 likes', color: 'bg-amber-900/50 border-amber-700' },
  { name: 'Day-to-Night / 日咖夜酒', pct: '20%', desc: 'BW\'s unique differentiator — daytime cafe, nighttime bar', color: 'bg-blue-900/50 border-blue-700' },
  { name: 'Date Night / 约会', pct: '10%', desc: 'Highest avg likes (3,354) — drive saves', color: 'bg-pink-900/50 border-pink-700' },
  { name: 'Menu & Value Reveals', pct: '10%', desc: 'Price anchoring — "人均RM45" removes friction', color: 'bg-green-900/50 border-green-700' },
];

const KPIS = [
  { metric: 'XHS Followers', m1: '200', m3: '1,000' },
  { metric: 'Posts Published', m1: '16', m3: '48' },
  { metric: 'Avg Likes/Post', m1: '50', m3: '200' },
  { metric: 'Top Post Likes', m1: '200', m3: '1,000' },
  { metric: 'KOC Posts feat. BW', m1: '3', m3: '25' },
  { metric: '"Found via XHS" %', m1: '5%', m3: '20%' },
  { metric: 'Revenue Delta', m1: '—', m3: 'RM5,000+/mo' },
];

const CORE_HASHTAGS = ['#SS2美食', '#PJ美食', '#吉隆坡手工pizza', '#马来西亚pizza', '#吉隆坡隐藏美食', '#吉隆坡宵夜', '#PJ美食探店'];

export default function StrategyPage() {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/strategy')
      .then(res => res.json())
      .then(json => {
        if (json.success) setCompletedTasks(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    const newVal = !completedTasks[taskId];
    setCompletedTasks(prev => ({ ...prev, [taskId]: newVal }));
    try {
      await fetch('/api/strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: newVal }),
      });
    } catch {
      setCompletedTasks(prev => ({ ...prev, [taskId]: !newVal }));
    }
  }, [completedTasks]);

  const getProgress = (tasks: readonly StrategyTask[]) => {
    const done = tasks.filter(t => completedTasks[t.id]).length;
    return { done, total: tasks.length, pct: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 };
  };

  const overallProgress = getProgress(ALL_TASKS);

  return (
    <>
      <PageHeader
        title="XHS Strategy"
        subtitle="Byondwalls Pizza Bar Cafe — 90-Day Launch Plan"
      />

      {/* Overall progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-300">Overall Progress</span>
          <span className="text-sm text-zinc-400">{overallProgress.done}/{overallProgress.total} tasks ({overallProgress.pct}%)</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress.pct}%` }}
          />
        </div>
      </div>

      {/* Content Pillars */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Content Pillars</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {CONTENT_PILLARS.map(pillar => (
            <div key={pillar.name} className={`rounded-lg border p-3 ${pillar.color}`}>
              <div className="text-xl font-bold text-zinc-100">{pillar.pct}</div>
              <div className="text-sm font-medium text-zinc-200 mt-1">{pillar.name}</div>
              <div className="text-xs text-zinc-400 mt-1">{pillar.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Hashtags */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">Core Hashtags (use every post)</h2>
        <div className="flex flex-wrap gap-2">
          {CORE_HASHTAGS.map(tag => (
            <span key={tag} className="bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-3 py-1.5 rounded-lg text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* KPI Targets */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-3">KPI Targets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Metric</th>
                <th className="text-right py-2 px-3 text-zinc-400 font-medium">Month 1</th>
                <th className="text-right py-2 px-3 text-zinc-400 font-medium">Month 3</th>
              </tr>
            </thead>
            <tbody>
              {KPIS.map(kpi => (
                <tr key={kpi.metric} className="border-b border-zinc-800/50">
                  <td className="py-2 px-3 text-zinc-300">{kpi.metric}</td>
                  <td className="py-2 px-3 text-right text-zinc-400">{kpi.m1}</td>
                  <td className="py-2 px-3 text-right text-zinc-200 font-medium">{kpi.m3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Budget */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Monthly Budget: RM1,310</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div><span className="text-zinc-500">Tier C (10x):</span> <span className="text-zinc-300">RM400</span></div>
          <div><span className="text-zinc-500">Tier B (4x):</span> <span className="text-zinc-300">RM320</span></div>
          <div><span className="text-zinc-500">Tier A (1x):</span> <span className="text-zinc-300">RM350</span></div>
          <div><span className="text-zinc-500">Media Night:</span> <span className="text-zinc-300">RM240</span></div>
        </div>
        <p className="text-xs text-zinc-500 mt-2">ROI break-even: 30 new XHS-sourced customers/month at RM45 avg spend = 1/day</p>
      </div>

      {/* Task Lists */}
      <TaskSection
        title="Do Right Now"
        subtitle="5 most important actions"
        tasks={IMMEDIATE_TASKS}
        completedTasks={completedTasks}
        onToggle={toggleTask}
        loading={loading}
        color="red"
      />

      <TaskSection
        title="Month 1: Foundation"
        subtitle="Build account, seed keywords, first KOC content"
        kpis="200 followers · 15+ saves on 1 post · 3+ UGC posts from KOCs"
        tasks={MONTH_1_TASKS}
        completedTasks={completedTasks}
        onToggle={toggleTask}
        loading={loading}
        color="amber"
      />

      <TaskSection
        title="Month 2: Growth"
        subtitle="High-reach creator posts go live, algorithm momentum"
        kpis="500 followers · 1 post with 500+ likes · 10+ KOC posts · Top 3 for 'SS2手工披萨'"
        tasks={MONTH_2_TASKS}
        completedTasks={completedTasks}
        onToggle={toggleTask}
        loading={loading}
        color="blue"
      />

      <TaskSection
        title="Month 3: Scale"
        subtitle="Consistent foot traffic from XHS, mega-KOL coverage"
        kpis="1,000 followers · 1 post with 1,000+ likes · 20% XHS attribution · RM5K+/mo revenue"
        tasks={MONTH_3_TASKS}
        completedTasks={completedTasks}
        onToggle={toggleTask}
        loading={loading}
        color="green"
      />
    </>
  );
}

interface TaskSectionProps {
  readonly title: string;
  readonly subtitle: string;
  readonly kpis?: string;
  readonly tasks: readonly StrategyTask[];
  readonly completedTasks: Record<string, boolean>;
  readonly onToggle: (id: string) => void;
  readonly loading: boolean;
  readonly color: 'red' | 'amber' | 'blue' | 'green';
}

const COLOR_MAP = {
  red: { border: 'border-red-800/50', bg: 'bg-red-900/20', badge: 'bg-red-900 text-red-300' },
  amber: { border: 'border-amber-800/50', bg: 'bg-amber-900/20', badge: 'bg-amber-900 text-amber-300' },
  blue: { border: 'border-blue-800/50', bg: 'bg-blue-900/20', badge: 'bg-blue-900 text-blue-300' },
  green: { border: 'border-green-800/50', bg: 'bg-green-900/20', badge: 'bg-green-900 text-green-300' },
} as const;

function TaskSection({ title, subtitle, kpis, tasks, completedTasks, onToggle, loading, color }: TaskSectionProps) {
  const colors = COLOR_MAP[color];
  const done = tasks.filter(t => completedTasks[t.id]).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className={`border ${colors.border} rounded-xl mb-4 overflow-hidden`}>
      <div className={`px-4 py-3 ${colors.bg} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
        <div>
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded font-medium ${colors.badge}`}>
            {done}/{tasks.length} done
          </span>
          <div className="w-20 bg-zinc-800 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {kpis && (
        <div className="px-4 py-2 border-b border-zinc-800/50 text-xs text-zinc-500">
          KPI: {kpis}
        </div>
      )}
      <div className="divide-y divide-zinc-800/50">
        {tasks.map(task => (
          <button
            key={task.id}
            onClick={() => onToggle(task.id)}
            disabled={loading}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors min-h-[48px]"
          >
            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
              ${completedTasks[task.id]
                ? 'bg-indigo-600 border-indigo-600'
                : 'border-zinc-600 hover:border-zinc-400'
              }`}
            >
              {completedTasks[task.id] && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${completedTasks[task.id] ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
              {task.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
