import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Simple bar chart component
interface BarChartData {
  label: string;
  value: number;
  color?: string;
  onClick?: () => void;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  maxValue?: number;
  horizontal?: boolean;
  showValues?: boolean;
  className?: string;
  barClassName?: string;
}

export function BarChart({
  data,
  title,
  maxValue,
  horizontal = false,
  showValues = true,
  className,
  barClassName,
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    return (
      <Card className={className}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {data.map((item, index) => (
            <div
              key={index}
              className={cn(
                "space-y-1",
                item.onClick && "cursor-pointer hover:opacity-80"
              )}
              onClick={item.onClick}
            >
              <div className="flex justify-between text-sm">
                <span className="truncate max-w-[200px]">{item.label}</span>
                {showValues && (
                  <span className="font-medium">{item.value}</span>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    barClassName || "bg-primary"
                  )}
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex items-end justify-between gap-2 h-48">
          {data.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col items-center gap-1 flex-1",
                item.onClick && "cursor-pointer hover:opacity-80"
              )}
              onClick={item.onClick}
            >
              <div className="relative w-full flex flex-col items-center">
                {showValues && (
                  <span className="text-xs font-medium mb-1">{item.value}</span>
                )}
                <div
                  className={cn(
                    "w-full max-w-[40px] rounded-t transition-all duration-500",
                    barClassName || "bg-primary"
                  )}
                  style={{
                    height: `${(item.value / max) * 150}px`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Stacked bar chart for NC breakdown
interface StackedBarData {
  label: string;
  segments: {
    value: number;
    color: string;
    label: string;
  }[];
  onClick?: () => void;
}

interface StackedBarChartProps {
  data: StackedBarData[];
  title?: string;
  className?: string;
}

export function StackedBarChart({
  data,
  title,
  className,
}: StackedBarChartProps) {
  const maxTotal = Math.max(
    ...data.map((d) => d.segments.reduce((sum, s) => sum + s.value, 0)),
    1
  );

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {data.map((item, index) => {
          const total = item.segments.reduce((sum, s) => sum + s.value, 0);
          return (
            <div
              key={index}
              className={cn(
                "space-y-1",
                item.onClick && "cursor-pointer hover:opacity-80"
              )}
              onClick={item.onClick}
            >
              <div className="flex justify-between text-sm">
                <span className="truncate max-w-[200px]">{item.label}</span>
                <span className="font-medium">{total}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                {item.segments.map((segment, segIndex) => (
                  <div
                    key={segIndex}
                    className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                    style={{
                      width: `${(segment.value / maxTotal) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                    title={`${segment.label}: ${segment.value}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {/* Legend */}
        {data[0]?.segments && (
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            {data[0].segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <span>{segment.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Line chart for trends
interface LineChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  title?: string;
  color?: string;
  className?: string;
  showArea?: boolean;
}

export function LineChart({
  data,
  title,
  color = "#3b82f6",
  className,
  showArea = true,
}: LineChartProps) {
  const { points, areaPath, linePath } = useMemo(() => {
    if (data.length === 0) return { points: [], areaPath: "", linePath: "" };

    const max = Math.max(...data.map((d) => d.value), 1);
    const min = Math.min(...data.map((d) => d.value), 0);
    const range = max - min || 1;
    const width = 100;
    const height = 100;
    const padding = 10;

    const pts = data.map((d, i) => ({
      x: padding + (i / (data.length - 1 || 1)) * (width - 2 * padding),
      y: height - padding - ((d.value - min) / range) * (height - 2 * padding),
      ...d,
    }));

    const linePathData = pts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPathData = `${linePathData} L ${pts[pts.length - 1]?.x || 0} ${height - padding} L ${padding} ${height - padding} Z`;

    return { points: pts, linePath: linePathData, areaPath: areaPathData };
  }, [data]);

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="relative h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            {showArea && (
              <path
                d={areaPath}
                fill={color}
                fillOpacity={0.1}
                className="transition-all duration-500"
              />
            )}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={2}
                fill={color}
                className="transition-all duration-500"
              />
            ))}
          </svg>
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((item, index) => (
              <span key={index}>{item.label}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Heatmap component
interface HeatmapCell {
  row: string;
  col: string;
  value: number;
  onClick?: () => void;
}

interface HeatmapProps {
  data: HeatmapCell[];
  rows: string[];
  cols: string[];
  title?: string;
  className?: string;
  colorScale?: { min: string; mid: string; max: string };
}

export function Heatmap({
  data,
  rows,
  cols,
  title,
  className,
  colorScale = { min: "#ef4444", mid: "#f59e0b", max: "#22c55e" },
}: HeatmapProps) {
  const getColor = (value: number) => {
    // Normalize value to 0-1 range (assuming 0-100 input)
    const normalized = Math.max(0, Math.min(100, value)) / 100;
    
    if (normalized < 0.5) {
      // Interpolate between min and mid
      const t = normalized * 2;
      return interpolateColor(colorScale.min, colorScale.mid, t);
    } else {
      // Interpolate between mid and max
      const t = (normalized - 0.5) * 2;
      return interpolateColor(colorScale.mid, colorScale.max, t);
    }
  };

  const getCellValue = (row: string, col: string) => {
    const cell = data.find((d) => d.row === row && d.col === col);
    return cell?.value ?? null;
  };

  const getCellOnClick = (row: string, col: string) => {
    const cell = data.find((d) => d.row === row && d.col === col);
    return cell?.onClick;
  };

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-1 text-left"></th>
                {cols.map((col) => (
                  <th key={col} className="p-1 text-center font-medium truncate max-w-[80px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <td className="p-1 font-medium truncate max-w-[120px]">{row}</td>
                  {cols.map((col) => {
                    const value = getCellValue(row, col);
                    const onClick = getCellOnClick(row, col);
                    return (
                      <td key={col} className="p-1">
                        {value !== null ? (
                          <div
                            className={cn(
                              "w-full h-8 rounded flex items-center justify-center text-white font-medium transition-all",
                              onClick && "cursor-pointer hover:opacity-80"
                            )}
                            style={{ backgroundColor: getColor(value) }}
                            onClick={onClick}
                            title={`${row} × ${col}: ${value}%`}
                          >
                            {value.toFixed(0)}%
                          </div>
                        ) : (
                          <div className="w-full h-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Color scale legend */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs">
          <span>0%</span>
          <div
            className="w-32 h-3 rounded"
            style={{
              background: `linear-gradient(to right, ${colorScale.min}, ${colorScale.mid}, ${colorScale.max})`,
            }}
          />
          <span>100%</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to interpolate between two hex colors
function interpolateColor(color1: string, color2: string, t: number): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Funnel chart component
interface FunnelData {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  data: FunnelData[];
  title?: string;
  className?: string;
}

export function FunnelChart({ data, title, className }: FunnelChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"];

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {data.map((item, index) => {
          const widthPercent = (item.value / maxValue) * 100;
          const color = item.color || colors[index % colors.length];

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1 flex justify-center">
                <div
                  className="h-10 rounded transition-all duration-500 flex items-center justify-center text-white font-medium text-sm"
                  style={{
                    width: `${widthPercent}%`,
                    minWidth: "60px",
                    backgroundColor: color,
                  }}
                >
                  {item.value}
                </div>
              </div>
              <span className="w-32 text-sm truncate">{item.label}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Pareto chart (bar + cumulative line)
interface ParetoData {
  label: string;
  value: number;
  onClick?: () => void;
}

interface ParetoChartProps {
  data: ParetoData[];
  title?: string;
  className?: string;
}

export function ParetoChart({ data, title, className }: ParetoChartProps) {
  const sortedData = [...data].sort((a, b) => b.value - a.value);
  const total = sortedData.reduce((sum, d) => sum + d.value, 0);
  const maxValue = sortedData[0]?.value || 1;

  let cumulative = 0;
  const dataWithCumulative = sortedData.map((d) => {
    cumulative += d.value;
    return { ...d, cumulative: (cumulative / total) * 100 };
  });

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="relative h-48">
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-1 pb-6">
            {dataWithCumulative.slice(0, 10).map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex-1 flex flex-col items-center",
                  item.onClick && "cursor-pointer hover:opacity-80"
                )}
                onClick={item.onClick}
              >
                <div
                  className="w-full bg-primary rounded-t transition-all duration-500"
                  style={{ height: `${(item.value / maxValue) * 120}px` }}
                />
              </div>
            ))}
          </div>
          {/* Cumulative line */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
          >
            <polyline
              points={dataWithCumulative
                .slice(0, 10)
                .map(
                  (d, i) =>
                    `${5 + (i / 9) * 90},${100 - d.cumulative * 0.85 - 10}`
                )
                .join(" ")}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          {dataWithCumulative.slice(0, 10).map((item, index) => (
            <span key={index} className="flex-1 text-center truncate px-0.5">
              {item.label.slice(0, 8)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default {
  BarChart,
  StackedBarChart,
  LineChart,
  Heatmap,
  FunnelChart,
  ParetoChart,
};
