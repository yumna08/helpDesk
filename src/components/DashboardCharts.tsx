'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  Open: '#D4FF4D',
  Assigned: '#f59e0b',
  'In Progress': '#818cf8',
  Resolved: '#34d399',
  Closed: '#6B7A6E',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#D4FF4D',
  Low: '#6B7A6E',
};

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #2A3139',
  backgroundColor: '#1A2128',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const tooltipLabelStyle = { fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' };
const tooltipItemStyle = { fontSize: '13px', fontWeight: 600, color: '#fff' };

export function TicketsLineChart({
  data,
}: {
  data: { name: string; created: number; resolved: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A3139" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7A6E', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7A6E', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Line
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="#D4FF4D"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#D4FF4D' }}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#34d399' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatusPieChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) {
    return (
      <div className="h-48 w-full flex items-center justify-center text-sm text-muted">
        No tickets yet
      </div>
    );
  }

  return (
    <div className="h-48 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {filtered.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#6B7A6E'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={tooltipItemStyle}
            labelStyle={tooltipLabelStyle}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PriorityBarChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full space-y-4">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-3">
          <div className="w-16 text-sm text-text-secondary shrink-0">{item.name}</div>
          <div className="flex-1 h-7 bg-surface-elevated rounded-xl relative overflow-hidden border border-border">
            <div
              className="absolute top-0 left-0 h-full rounded-xl transition-all"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: PRIORITY_COLORS[item.name] ?? '#6B7A6E',
                minWidth: item.value > 0 ? '4px' : '0',
              }}
            />
          </div>
          <div className="w-6 text-sm font-bold text-accent text-right">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
