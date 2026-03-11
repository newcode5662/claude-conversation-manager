import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { useSessionStore } from '../../stores/sessionStore';
import { formatNumber } from '../../utils/format';
import { MessageSquare, Hash, Folder, TrendingUp } from 'lucide-react';
import type { StatsData } from '../../types';

export function StatsDashboard() {
  const { loadStats } = useSessionStore();
  const [stats, setStats] = useState<StatsData>({
    totalSessions: 0,
    totalPrompts: 0,
    uniqueProjects: 0,
    sessionsByDate: [],
    promptsByDate: [],
    topProjects: [],
  });
  const sessionsChartRef = useRef<HTMLDivElement>(null);
  const promptsChartRef = useRef<HTMLDivElement>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats().then(setStats);
  }, [loadStats]);

  useEffect(() => {
    if (!sessionsChartRef.current || !promptsChartRef.current) return;
    if (stats.sessionsByDate.length === 0) return;

    // Sessions by date chart
    const sessionsChart = echarts.init(sessionsChartRef.current);
    sessionsChart.setOption({
      title: {
        text: '会话数量趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} 个会话',
      },
      xAxis: {
        type: 'category',
        data: stats.sessionsByDate.map((d) => d.date.slice(5)),
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          data: stats.sessionsByDate.map((d) => d.count),
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(217, 119, 87, 0.3)' },
                { offset: 1, color: 'rgba(217, 119, 87, 0.05)' },
              ],
            },
          },
          lineStyle: { color: '#d97757', width: 2 },
          itemStyle: { color: '#d97757' },
        },
      ],
      grid: { left: 60, right: 30, top: 60, bottom: 60 },
    });

    // Prompts by date chart
    const promptsChart = echarts.init(promptsChartRef.current);
    promptsChart.setOption({
      title: {
        text: '提示数量趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c} 条提示',
      },
      xAxis: {
        type: 'category',
        data: stats.promptsByDate.map((d) => d.date.slice(5)),
        axisLabel: { rotate: 45 },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          data: stats.promptsByDate.map((d) => d.count),
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#665c4d' },
                { offset: 1, color: '#9c9180' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
      grid: { left: 60, right: 30, top: 60, bottom: 60 },
    });

    const handleResize = () => {
      sessionsChart.resize();
      promptsChart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sessionsChart.dispose();
      promptsChart.dispose();
    };
  }, [stats]);

  const statCards = [
    {
      title: '总会话数',
      value: formatNumber(stats.totalSessions),
      icon: MessageSquare,
      color: 'bg-orange-500',
    },
    {
      title: '总提示数',
      value: formatNumber(stats.totalPrompts),
      icon: Hash,
      color: 'bg-claude-700',
    },
    {
      title: '项目数',
      value: formatNumber(stats.uniqueProjects),
      icon: Folder,
      color: 'bg-green-600',
    },
    {
      title: '活跃天数',
      value: formatNumber(stats.sessionsByDate.length),
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-claude-50">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-claude-900">统计分析</h2>
          <p className="text-claude-500 mt-1">查看你的 Claude Code CLI 使用情况和趋势</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-claude-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-claude-500">{card.title}</p>
                  <p className="text-2xl font-semibold text-claude-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-claude-200">
            <div ref={sessionsChartRef} style={{ height: 300 }} />
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-claude-200">
            <div ref={promptsChartRef} style={{ height: 300 }} />
          </div>
        </div>

        {/* Top Projects */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-claude-200">
          <h3 className="text-lg font-medium text-claude-900 mb-4">最活跃的项目</h3>
          {stats.topProjects.length === 0 ? (
            <p className="text-claude-400 text-center py-8">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {stats.topProjects.map((proj, index) => (
                <div
                  key={proj.project}
                  className="flex items-center justify-between p-3 bg-claude-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white text-xs font-medium rounded-full flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-medium text-claude-700 truncate font-mono text-sm" title={proj.project}>
                      {proj.project}
                    </span>
                  </div>
                  <span className="text-sm text-claude-500 flex-shrink-0">{proj.count} 个会话</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
