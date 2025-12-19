
import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceArea, ReferenceLine, Label, ReferenceDot
} from 'recharts';
import { FFTResult, ProcessedDataPoint, DataAxis, AnalysisStats } from '../types';

interface VerticalLineDef {
  x: number;
  color: string;
  label?: string;
  dash?: string;
}

interface HighlightAreaDef {
  x1: number;
  x2: number;
  color: string;
}

interface TimeChartProps {
  data: ProcessedDataPoint[];
  axis: DataAxis;
  color: string;
  syncId?: string;
  windowRange?: { start: number; end: number };
  referenceLines?: number[]; // Horizontal lines (e.g. +/- 10)
  verticalLines?: VerticalLineDef[]; // Vertical lines (e.g. ISO limits)
  highlightAreas?: HighlightAreaDef[]; // Vertical areas (e.g. Const Vel region)
  onChartClick?: (time: number) => void;
  globalStats?: AnalysisStats | null;
  yDomain?: [number | 'auto', number | 'auto'];
  xDomain?: [number, number]; // New prop for Zoom control
  onZoom?: (left: number, right: number) => void; // Callback for zoom
  gridColor?: string;
  textColor?: string;
  brushColor?: string;
}

const formatYAxis = (val: number) => {
  if (val === 0) return "0.00";
  return val.toFixed(2);
};

export const TimeChart: React.FC<TimeChartProps> = ({ 
  data, 
  axis, 
  color, 
  syncId,
  windowRange,
  referenceLines,
  verticalLines,
  highlightAreas,
  onChartClick,
  globalStats,
  yDomain = ['auto', 'auto'],
  xDomain,
  onZoom,
  gridColor = "#374151",
  textColor = "#9ca3af",
  brushColor = "#9ca3af"
}) => {
  const unit = axis.startsWith('a') ? 'Gals' : axis === 'vz' ? 'm/s' : 'm';

  // Internal state for drag-to-zoom interaction
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) {
      setRefAreaLeft(Number(e.activeLabel));
    }
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft !== null && e && e.activeLabel) {
      setRefAreaRight(Number(e.activeLabel));
    }
  };

  const handleMouseUp = () => {
    if (refAreaLeft !== null && refAreaRight !== null && onZoom) {
      const [left, right] = [refAreaLeft, refAreaRight].sort((a, b) => a - b);
      if (right > left) {
        onZoom(left, right);
      }
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  return (
    <div className="h-full w-full relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          syncId={syncId}
          onMouseDown={onZoom ? handleMouseDown : undefined}
          onMouseMove={onZoom ? handleMouseMove : undefined}
          onMouseUp={onZoom ? handleMouseUp : undefined}
          onClick={(e) => {
            // Only trigger click if we weren't dragging (zooming)
            if (!refAreaLeft && onChartClick && e && e.activeLabel) {
              onChartClick(Number(e.activeLabel));
            }
          }}
          margin={{ top: 20, right: 40, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <XAxis 
            dataKey="time" 
            type="number" 
            domain={xDomain || ['dataMin', 'dataMax']} 
            allowDataOverflow={true}
            hide={false} 
            stroke={textColor}
            fontSize={10}
            tickFormatter={(val) => val.toFixed(1) + 's'}
            minTickGap={50}
          />
          <YAxis 
            stroke={textColor} 
            fontSize={13} 
            tickFormatter={formatYAxis}
            width={60}
            allowDataOverflow={true}
            domain={yDomain}
          >
             <Label 
               value={unit} 
               angle={-90} 
               position="insideLeft" 
               style={{ textAnchor: 'middle', fill: textColor, fontSize: 12 }} 
             />
          </YAxis>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', border: `1px solid ${gridColor}`, color: '#fff' }}
            labelStyle={{ color: textColor }}
            itemStyle={{ color: color }}
            formatter={(value: number) => [formatYAxis(value), axis.toUpperCase()]}
            labelFormatter={(label) => `Time: ${Number(label).toFixed(3)}s`}
          />
          
          {highlightAreas && highlightAreas.map((area, idx) => (
             <ReferenceArea
               key={`area-${idx}`}
               x1={area.x1}
               x2={area.x2}
               fill={area.color}
               fillOpacity={0.15}
               ifOverflow="extendDomain"
             />
          ))}

          {windowRange && (
            <ReferenceArea 
              x1={windowRange.start} 
              x2={windowRange.end} 
              fill={color} 
              fillOpacity={0.1}
              stroke={color}
              strokeOpacity={0.3}
              ifOverflow="extendDomain"
            />
          )}

          {refAreaLeft !== null && refAreaRight !== null && (
            <ReferenceArea 
              x1={refAreaLeft} 
              x2={refAreaRight} 
              strokeOpacity={0.3} 
              fill={textColor}
              fillOpacity={0.3} 
            />
          )}

          <Line 
            type="monotone" 
            dataKey={axis} 
            stroke={color} 
            strokeWidth={1.5} 
            dot={false} 
            isAnimationActive={false} 
          />

          {referenceLines && referenceLines.map((val, idx) => (
             <ReferenceLine key={`href-${idx}`} y={val} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" opacity={1}>
               <Label value={val.toString()} position="right" fill="#ef4444" fontSize={10} fontWeight="bold" />
             </ReferenceLine>
          ))}

          {verticalLines && verticalLines.map((line, idx) => (
            <ReferenceLine 
              key={`vref-${idx}`} 
              x={line.x} 
              stroke={line.color} 
              strokeWidth={2} 
              strokeDasharray={line.dash}
              opacity={0.8}
            >
              {line.label && (
                <Label 
                  value={line.label} 
                  position="insideTopRight" 
                  fill={line.color} 
                  fontSize={10} 
                  fontWeight="bold"
                  angle={-90} 
                  offset={10}
                />
              )}
            </ReferenceLine>
          ))}
          
          {globalStats?.max0PkPoint && (
            <ReferenceDot 
              x={globalStats.max0PkPoint.time} 
              y={globalStats.max0PkPoint.value} 
              r={5} 
              fill="transparent"
              stroke={textColor}
              strokeWidth={2}
              strokeDasharray="3 3"
              ifOverflow="hidden"
            >
              <Label 
                value={`0-Pk: ${globalStats.zeroPk.toFixed(2)}`} 
                position="top" 
                fill={textColor} 
                fontSize={12} 
                fontWeight="bold"
                offset={10}
              />
            </ReferenceDot>
          )}

          {globalStats?.maxPkPkPair && (
            <>
              <ReferenceLine 
                segment={[
                  { x: globalStats.maxPkPkPair[0].time, y: globalStats.maxPkPkPair[0].value },
                  { x: globalStats.maxPkPkPair[1].time, y: globalStats.maxPkPkPair[1].value }
                ]}
                stroke="#fbbf24"
                strokeWidth={2}
                strokeDasharray="3 3"
                ifOverflow="visible"
              />

              <ReferenceDot 
                x={globalStats.maxPkPkPair[0].time} 
                y={globalStats.maxPkPkPair[0].value} 
                r={4} 
                fill="#fbbf24" 
                stroke="none"
                ifOverflow="hidden"
              >
                <Label 
                  value={`Pk-Pk: ${globalStats.pkPk.toFixed(2)}`} 
                  position="top" 
                  fill={textColor} 
                  fontSize={12} 
                  fontWeight="bold" 
                  offset={10}
                />
              </ReferenceDot>
              <ReferenceDot 
                x={globalStats.maxPkPkPair[1].time} 
                y={globalStats.maxPkPkPair[1].value} 
                r={4} 
                fill="#fbbf24" 
                stroke="none"
                ifOverflow="hidden"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface FFTChartProps {
  data: FFTResult[];
  color: string;
  gridColor?: string;
  textColor?: string;
  mode?: 'window' | 'constVel';
}

// Custom Shape for Right-Aligned Label
const RightSideLabel = (props: any) => {
  const { cx, cy, stroke, value, frequency, textColor, isLast } = props;
  
  const rms = value;
  const peak = rms * 1.4142;

  // If point is close to the right edge, shift label left
  const isFarRight = cx > 700; 

  return (
    <g style={{ pointerEvents: 'none' }}>
      <circle cx={cx} cy={cy} r={3} fill={stroke} stroke="white" strokeWidth={1} />
      <text 
        x={isFarRight ? cx - 10 : cx + 10} 
        y={cy} 
        dy={4} 
        fill={textColor} 
        fontSize={11} 
        fontWeight="bold" 
        textAnchor={isFarRight ? "end" : "start"}
        className="drop-shadow-sm"
      >
        {peak.toFixed(2)} Gals (Peak) / {rms.toFixed(2)} Gals (RMS) ,{frequency.toFixed(1)} HZ
      </text>
    </g>
  );
};

export const FFTChart: React.FC<FFTChartProps> = ({ 
  data, 
  color,
  gridColor = "#374151",
  textColor = "#9ca3af",
  mode = 'window'
}) => {
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);

  const handleMouseDown = (e: any) => {
    if (e && e.activeLabel) setRefAreaLeft(Number(e.activeLabel));
  };

  const handleMouseMove = (e: any) => {
    if (refAreaLeft !== null && e && e.activeLabel) setRefAreaRight(Number(e.activeLabel));
  };

  const handleMouseUp = () => {
    if (refAreaLeft !== null && refAreaRight !== null) {
      const [left, right] = [refAreaLeft, refAreaRight].sort((a, b) => a - b);
      if (right > left) setZoomDomain([left, right]);
    }
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const resetZoom = () => setZoomDomain(null);

  // Get top 3 peaks within current zoom domain
  const visibleData = useMemo(() => {
    if (!zoomDomain) return data;
    return data.filter(d => d.frequency >= zoomDomain[0] && d.frequency <= zoomDomain[1]);
  }, [data, zoomDomain]);

  const top3Peaks = useMemo(() => {
    return [...visibleData]
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 3);
  }, [visibleData]);

  // 计算自适应的 X 轴最大值
  // 窗口分析模式上限 300Hz, 匀速阶段全局模式上限 800Hz
  const defaultXMax = useMemo(() => {
    if (data.length === 0) return mode === 'window' ? 300 : 800;
    const maxDataFreq = data[data.length - 1].frequency;
    const ceiling = mode === 'window' ? 300 : 800;
    return Math.min(maxDataFreq, ceiling);
  }, [data, mode]);

  return (
    <div className="h-full w-full relative group">
      {zoomDomain && (
        <button 
          onClick={resetZoom}
          className="absolute top-2 right-2 z-30 p-2 bg-gray-900/90 hover:bg-gray-800 text-white rounded border border-gray-700 shadow-xl backdrop-blur-md transition-all active:scale-90"
          title="Reset Zoom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <defs>
            <linearGradient id={`colorSplit-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
          <XAxis 
            dataKey="frequency" 
            type="number" 
            stroke={textColor} 
            fontSize={11}
            tickCount={10}
            domain={zoomDomain || [0, defaultXMax]}
            allowDataOverflow={true}
            tickFormatter={(val) => Math.round(val).toString()}
            label={{ value: 'Frequency (Hz)', position: 'insideBottom', offset: -5, fill: textColor }}
          />
          <YAxis 
            stroke={textColor} 
            fontSize={12} 
            tickFormatter={formatYAxis}
            width={50}
          />
          <Tooltip 
            cursor={{stroke: textColor, strokeWidth: 1, strokeDasharray: '3 3'}}
            contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', border: `1px solid ${gridColor}`, color: '#fff' }}
            formatter={(value: number) => [`${(value * 1.4142).toFixed(2)} Gals`, 'Peak']}
            labelFormatter={(label) => `Freq: ${Number(label).toFixed(1)} Hz`}
          />
          <Area 
            type="monotone" 
            dataKey="magnitude" 
            stroke={color} 
            fillOpacity={1} 
            fill={`url(#colorSplit-${color})`} 
            isAnimationActive={false}
          />

          {refAreaLeft !== null && refAreaRight !== null && (
            <ReferenceArea 
              x1={refAreaLeft} 
              x2={refAreaRight} 
              fill={textColor}
              fillOpacity={0.2} 
            />
          )}
          
          {top3Peaks.map((point, index) => (
             point.magnitude > 0 && (
              <ReferenceDot 
                key={index}
                x={point.frequency} 
                y={point.magnitude} 
                r={0} 
                fill={color}
                stroke={color}
                ifOverflow="hidden"
                shape={(props: any) => (
                  <RightSideLabel 
                    {...props} 
                    textColor={textColor} 
                    value={point.magnitude}
                    frequency={point.frequency}
                  />
                )}
              />
             )
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
