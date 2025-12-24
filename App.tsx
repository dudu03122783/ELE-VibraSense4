
import React, { useState, useEffect, useMemo, useRef } from 'react';
import FileUpload from './components/FileUpload.tsx';
import { TimeChart, FFTChart } from './components/Charts.tsx';
import { calculateFFT, calculateStats, downsampleData, processVibrationData, calculateLiftBoundaries, calculateIsoStats } from './utils/mathUtils.ts';
import { applyFilters } from './utils/dspUtils.ts';
import { analyzeWithGemini } from './services/geminiService.ts';
import { getMachineSpecs, calculateMachineFreqs, MachineSpec, TheoreticalFreqs } from './utils/machineData.ts';
import { ProcessedDataPoint, DataAxis, AnalysisStats, AIAnalysisResult, ThemeConfig, FilterConfig, RawDataPoint, ElevatorBoundaries, IsoStats } from './types.ts';

const DEFAULT_SAMPLE_RATE = 1600;

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  zh: {
    title: 'MESE ELEVATOR VIBRATION ANALYSIS SYSTEM',
    upload: '上传文件',
    theme: '主题',
    close: '关闭文件',
    globalStats: 'ISO 18738 / GB/T 24474 统计',
    globalStatsNote: '界限定义: t1-t2 (恒速区), t0-t3 (全过程)',
    showBoundaries: '显示界限 (Lim 0-3)',
    windowAnalysis: '窗口分析 (FFT)',
    windowControl: '分析窗口控制',
    constVelFFT: '匀速阶段全局FFT',
    viewControl: '视图 / 缩放控制',
    chartHeight: '图表高度',
    aiDiag: '智能诊断',
    analyzing: '计算中...',
    kinematics: '运动学',
    vibration: '振动',
    fft: '频谱分析',
    yScale: 'Y轴范围',
    refLines: '参考线',
    dominant: '主频',
    magnitude: '幅值',
    unitAccel: 'Gals',
    maxPkPk: '最大峰峰值 (Max Pk-Pk)',
    max0Pk: '最大单峰值 (Max 0-Pk)',
    a95: 'A95 峰峰值',
    rms: '时间平均计权值 (aw)',
    peak: '峰值 (Peak)',
    dragDrop: '拖拽或点击上传',
    supports: '支持 .csv 格式 (包含 ax, ay, az 列)',
    systemInfo: '系统将自动通过积分计算速度(Vz)和位移(Sz)',
    dsp: '信号处理 / 滤波器',
    enableFilter: '启用滤波',
    highPass: '高通 (Hz)',
    lowPass: '低通 (Hz)',
    presetIso: 'GB/T 24474 (10Hz)',
    presetDefault: '复位 (全通)',
    target: '目标',
    targetAll: '所有轴',
    targetZ: '仅 Z 轴',
    creator: '制作者：chaizhh@mese-cn.com',
    smecInfo: '请导入SMEC 便携式震动仪数据，该数据可以从钉钉工作台《智能震动测量分析》软件中下载数据',
    viewStart: '视图起点 (s)',
    viewEnd: '视图终点 (s)',
    focusWindow: '聚焦分析窗口',
    resetView: '复位视图',
    resetLayout: '重置布局',
    zoomTip: '提示: 在图表上拖拽可放大',
    toggleSidebar: '侧边栏',
    export: '导出/打印',
    exportTitle: '导出选项',
    selectCharts: '选择图表',
    selectAll: '全选',
    print: '打印预览 (Print)',
    saveImage: '保存全套分析报告 (PNG)',
    cancel: '取消',
    showChart: '显示图表',
    hideChart: '隐藏图表',
    t1t2: '恒速区 (t1-t2)',
    t0t3: '全过程 (t0-t3)',
    kalman: '卡尔曼滤波 (Kalman)',
    kalmanQ: '过程噪声 Q (灵敏度)',
    kalmanR: '测量噪声 R (平滑度)',
    dataSettings: '数据源设置',
    sampleRate: '采样频率 (Hz)',
    sampleRateNote: '修改后系统将重新计算时间轴、速度和位移',
    theoretical: '理论频率显示',
    theoreticalHide: '理论频率隐藏',
    theoModalTitle: '理论频率计算参数',
    machineModel: '曳引机型号',
    speed: '电梯额定速度 (m/s)',
    ropeType: '钢丝绳类型',
    normalRope: '普通钢丝绳',
    sflexRope: 'Sflex 钢丝绳',
    showTable: '显示理论值',
    hideTable: '隐藏',
    // Report Translations
    reportTitle: 'MESE 电梯振动分析报告',
    reportFile: '文件',
    reportDate: '日期',
    reportMetric: '指标',
    reportAxisX: 'X 轴 (Gals)',
    reportAxisY: 'Y 轴 (Gals)',
    reportAxisZ: 'Z 轴 (Gals)',
    reportVibTitle: '1. 振动 (加速度)',
    reportFftTitle: '2. 频谱分析 (FFT)',
    reportKinTitle: '3. 运动学 (速度/位移)'
  },
  en: {
    title: 'MESE ELEVATOR VIBRATION ANALYSIS SYSTEM',
    upload: 'Upload File',
    theme: 'Theme',
    close: 'Close File',
    globalStats: 'ISO 18738 / GB/T 24474 Stats',
    globalStatsNote: 'Boundaries: t1-t2 (Const Vel), t0-t3 (Total)',
    showBoundaries: 'Show Boundaries (Lim 0-3)',
    windowAnalysis: 'Window Analysis (FFT)',
    windowControl: 'Window Analysis',
    constVelFFT: 'Const Vel Global FFT',
    viewControl: 'View / Zoom Control',
    chartHeight: 'Chart Height',
    aiDiag: 'Diagnostics',
    analyzing: 'Computing...',
    kinematics: 'KINEMATICS',
    vibration: 'VIBRATION',
    fft: 'FREQUENCY ANALYSIS',
    yScale: 'Y-SCALE',
    refLines: 'Ref Lines',
    dominant: 'Dominant',
    magnitude: 'Magnitude',
    unitAccel: 'Gals',
    maxPkPk: 'Max Pk-Pk',
    max0Pk: 'Max 0-Pk',
    a95: 'A95 Pk-Pk',
    rms: 'Time-Averaged Weighted (aw)',
    peak: 'Peak',
    dragDrop: 'Drag & Drop or Click to Upload',
    supports: 'Supports .csv (ax, ay, az)',
    systemInfo: 'The system will automatically calculate Velocity (Vz) and Displacement (Sz) via integration.',
    dsp: 'Signal Processing / Filters',
    enableFilter: 'Enable Filtering',
    highPass: 'High Pass (Hz)',
    lowPass: 'Low Pass (Hz)',
    presetIso: 'GB/T 24474 (10Hz)',
    presetDefault: 'Reset',
    target: 'Target',
    targetAll: 'All Axes',
    targetZ: 'Z-Axis Only',
    creator: 'Created by: chaizhh@mese-cn.com',
    smecInfo: 'Please import SMEC portable vibrometer data (download from DingTalk Smart Vibration Analysis app).',
    viewStart: 'View Start (s)',
    viewEnd: 'View End (s)',
    focusWindow: 'Focus Window',
    resetView: 'Reset View',
    resetLayout: 'Reset Layout',
    zoomTip: 'Tip: Drag on chart to zoom',
    toggleSidebar: 'Sidebar',
    export: 'Export/Print',
    exportTitle: 'Export Options',
    selectCharts: 'Select Charts',
    selectAll: 'Select All',
    print: 'Print Preview',
    saveImage: 'Save Full Report (PNG)',
    cancel: 'Cancel',
    showChart: 'Show Chart',
    hideChart: 'Hide Chart',
    t1t2: 'Const Vel (t1-t2)',
    t0t3: 'Total (t0-t3)',
    kalman: 'Kalman Filter',
    kalmanQ: 'Process Noise Q (Sensitivity)',
    kalmanR: 'Measure Noise R (Smoothness)',
    dataSettings: 'Data Settings',
    sampleRate: 'Sampling Rate (Hz)',
    sampleRateNote: 'Changing this will re-calculate time, velocity and displacement',
    theoretical: 'Theoretical Freqs',
    theoreticalHide: 'Hide Theo Freqs',
    theoModalTitle: 'Theoretical Freq Parameters',
    machineModel: 'Machine Model',
    speed: 'Rated Speed (m/s)',
    ropeType: 'Rope Type',
    normalRope: 'Normal',
    sflexRope: 'Sflex',
    showTable: 'Show Values',
    hideTable: 'Hide',
    // Report Translations
    reportTitle: 'MESE Vibration Analysis Report',
    reportFile: 'File',
    reportDate: 'Date',
    reportMetric: 'Metric',
    reportAxisX: 'X-Axis (Gals)',
    reportAxisY: 'Y-Axis (Gals)',
    reportAxisZ: 'Z-Axis (Gals)',
    reportVibTitle: '1. Vibration (Acceleration)',
    reportFftTitle: '2. Frequency Analysis (FFT)',
    reportKinTitle: '3. Kinematics'
  }
};

// --- THEME DEFINITIONS ---
const THEMES: ThemeConfig[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    bgApp: 'bg-gray-950',
    bgCard: 'bg-gray-900/50',
    bgPanel: 'bg-gray-900',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-gray-800',
    accent: 'text-teal-400',
    gridColor: '#374151',
    brushColor: '#6b7280',
    textColorHex: '#9ca3af',
    chartColors: { ax: '#ef4444', ay: '#22c55e', az: '#3b82f6', vz: '#a855f7', sz: '#f97316' }
  },
  {
    id: 'antigravity',
    name: 'Antigravity (Default)',
    bgApp: 'bg-slate-950',
    bgCard: 'bg-slate-900/80',
    bgPanel: 'bg-slate-900',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    border: 'border-slate-700',
    accent: 'text-fuchsia-400',
    gridColor: '#475569',
    brushColor: '#cbd5e1',
    textColorHex: '#cbd5e1',
    chartColors: { ax: '#f472b6', ay: '#4ade80', az: '#22d3ee', vz: '#c084fc', sz: '#fbbf24' }
  },
  {
    id: 'engineering',
    name: 'Engineering (Warm)',
    bgApp: 'bg-[#fefce8]',
    bgCard: 'bg-[#fffbeb]',
    bgPanel: 'bg-[#fcfbf7]', 
    textPrimary: 'text-stone-800',
    textSecondary: 'text-stone-500',
    border: 'border-stone-300',
    accent: 'text-amber-600',
    gridColor: '#d6d3d1',
    brushColor: '#a8a29e',
    textColorHex: '#57534e',
    chartColors: { ax: '#dc2626', ay: '#16a34a', az: '#2563eb', vz: '#7c3aed', sz: '#d97706' }
  },
  {
    id: 'pure-white',
    name: 'Pure White',
    bgApp: 'bg-white',
    bgCard: 'bg-white',
    bgPanel: 'bg-white', 
    textPrimary: 'text-gray-950',
    textSecondary: 'text-gray-500',
    border: 'border-gray-200',
    accent: 'text-blue-600',
    gridColor: '#e5e7eb',
    brushColor: '#9ca3af',
    textColorHex: '#374151',
    chartColors: { ax: '#ef4444', ay: '#16a34a', az: '#2563eb', vz: '#7c3aed', sz: '#d97706' }
  }
];

const App: React.FC = () => {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = TRANSLATIONS[lang];

  const [rawData, setRawData] = useState<RawDataPoint[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [displayData, setDisplayData] = useState<ProcessedDataPoint[]>([]);
  const [finalProcessedData, setFinalProcessedData] = useState<ProcessedDataPoint[] | null>(null);
  const [sampleRate, setSampleRate] = useState<number>(DEFAULT_SAMPLE_RATE);

  const [boundaries, setBoundaries] = useState<ElevatorBoundaries | null>(null);
  const [isoStats, setIsoStats] = useState<IsoStats | null>(null);
  const [showIsoBoundaries, setShowIsoBoundaries] = useState(false);

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    enabled: false,
    highPassFreq: 0,
    lowPassFreq: 30,
    isStandardWeighting: false,
    targetAxes: 'all',
    enableKalman: false,
    kalmanQ: 0.01,
    kalmanR: 1.0
  });

  // Theoretical Freq States
  const [showTheoModal, setShowTheoModal] = useState(false);
  const [showTheoLines, setShowTheoLines] = useState(false);
  const [machineSpecs] = useState<MachineSpec[]>(getMachineSpecs());
  const [selectedMachine, setSelectedMachine] = useState<string>(machineSpecs[0]?.model || '');
  const [ratedSpeed, setRatedSpeed] = useState<number>(1.0);
  const [ropeType, setRopeType] = useState<'normal' | 'sflex'>('normal');
  const [theoFreqs, setTheoFreqs] = useState<TheoreticalFreqs | null>(null);

  const [currentThemeId, setCurrentThemeId] = useState<string>('antigravity');
  const theme = useMemo(() => THEMES.find(t => t.id === currentThemeId) || THEMES[0], [currentThemeId]);

  const [accelAxis, setAccelAxis] = useState<DataAxis>('az');
  const [intAxis, setIntAxis] = useState<DataAxis>('vz');

  const [yMinAccel, setYMinAccel] = useState<string>('');
  const [yMaxAccel, setYMaxAccel] = useState<string>('');
  const [yMinInt, setYMinInt] = useState<string>('');
  const [yMaxInt, setYMaxInt] = useState<string>('');
  
  const [viewDomain, setViewDomain] = useState<[number, number] | null>(null);
  const [chartHeight, setChartHeight] = useState<number>(350);

  const [windowStart, setWindowStart] = useState<number>(0);
  const [windowSize, setWindowSize] = useState<number>(4);
  
  const [fftMode, setFftMode] = useState<'window' | 'constVel'>('constVel');
  
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refLineLevel, setRefLineLevel] = useState<number | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelection, setExportSelection] = useState({ vibration: true, fft: true, kinematics: true });
  const [isFFTVisible, setIsFFTVisible] = useState(true);
  
  const chartsContainerRef = useRef<HTMLDivElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null); // Ref for the hidden export container

  const handleFileLoad = (processed: ProcessedDataPoint[], name: string) => {
    const raw: RawDataPoint[] = processed.map(p => ({ time: p.time, ax: p.ax, ay: p.ay, az: p.az }));
    setRawData(raw);
    setFileName(name);
  };

  // Recalculate theoretical freqs when parameters change
  useEffect(() => {
    if (showTheoLines) {
      const spec = machineSpecs.find(m => m.model === selectedMachine);
      if (spec) {
        const freqs = calculateMachineFreqs(spec, ratedSpeed, ropeType);
        setTheoFreqs(freqs);
      } else {
        setTheoFreqs(null);
      }
    } else {
      setTheoFreqs(null);
    }
  }, [showTheoLines, selectedMachine, ratedSpeed, ropeType, machineSpecs]);

  useEffect(() => {
    if (!rawData) return;
    const adjustedRawData = rawData.map((d, i) => ({
      ...d,
      time: i / sampleRate
    }));

    let dataToProcess = adjustedRawData;
    if (filterConfig.enabled) {
      dataToProcess = applyFilters(adjustedRawData, sampleRate, filterConfig);
    }
    const processed = processVibrationData(dataToProcess, sampleRate);
    setFinalProcessedData(processed);

    const bounds = calculateLiftBoundaries(processed);
    setBoundaries(bounds);
    const stats = calculateIsoStats(processed, bounds);
    setIsoStats(stats);
  }, [rawData, filterConfig, sampleRate]);

  useEffect(() => {
    if (finalProcessedData) {
      setDisplayData(downsampleData(finalProcessedData, 8000));
    } else {
      setDisplayData([]);
    }
  }, [finalProcessedData]);

  const fftSourceData = useMemo(() => {
    if (!finalProcessedData) return [];
    
    if (fftMode === 'constVel' && boundaries && boundaries.isValid) {
      const startIndex = Math.max(0, Math.floor(boundaries.t1 * sampleRate));
      const endIndex = Math.min(finalProcessedData.length, Math.floor(boundaries.t2 * sampleRate));
      return finalProcessedData.slice(startIndex, endIndex);
    }
    
    const startIndex = Math.floor(windowStart * sampleRate);
    const endIndex = Math.floor((windowStart + windowSize) * sampleRate);
    return finalProcessedData.slice(startIndex, Math.min(endIndex, finalProcessedData.length));
  }, [finalProcessedData, fftMode, boundaries, windowStart, windowSize, sampleRate]);

  // Compute FFT for all axes for the export feature
  const allFFTs = useMemo(() => {
    // CRITICAL FIX: Only calculate when export modal is open to fix performance
    if (!showExportModal || fftSourceData.length === 0) return null;
    return {
      ax: calculateFFT(fftSourceData.map(d => d.ax), sampleRate),
      ay: calculateFFT(fftSourceData.map(d => d.ay), sampleRate),
      az: calculateFFT(fftSourceData.map(d => d.az), sampleRate)
    };
  }, [fftSourceData, sampleRate, showExportModal]);

  const currentGlobalStats = useMemo(() => {
    if (!isoStats) return null;
    if (accelAxis === 'ax') return isoStats.x.constVel;
    if (accelAxis === 'ay') return isoStats.y.constVel;
    if (accelAxis === 'az') {
      return {
        ...isoStats.z.constVel, 
        pkPk: isoStats.z.global?.pkPk || isoStats.z.constVel.pkPk,
        maxPkPkPair: isoStats.z.global?.maxPkPkPair
      };
    }
    return null;
  }, [isoStats, accelAxis]);

  const { isoVerticalLines, isoHighlightAreas } = useMemo(() => {
    if (!showIsoBoundaries) return { isoVerticalLines: [], isoHighlightAreas: [] };
    if (!boundaries || !boundaries.isValid) return { isoVerticalLines: [], isoHighlightAreas: [] };
    const lines = [
      { x: boundaries.t0, color: '#22c55e', label: 'Lim 0', dash: '3 3' },
      { x: boundaries.t1, color: '#3b82f6', label: 'Lim 1' },
      { x: boundaries.t2, color: '#3b82f6', label: 'Lim 2' },
      { x: boundaries.t3, color: '#ef4444', label: 'Lim 3', dash: '3 3' },
    ];
    const areas = [{ x1: boundaries.t1, x2: boundaries.t2, color: '#a855f7' }];
    return { isoVerticalLines: lines, isoHighlightAreas: areas };
  }, [boundaries, showIsoBoundaries]);

  const { fftData, windowStats, peakFreq } = useMemo(() => {
    if (fftSourceData.length === 0) return { fftData: [], windowStats: null, peakFreq: null };
    const series = fftSourceData.map(d => d[accelAxis]);
    const fft = calculateFFT(series, sampleRate);
    const stats = calculateStats(fftSourceData, accelAxis);
    let maxMag = 0, pFreq = 0;
    fft.forEach(f => {
      if(f.magnitude > maxMag) {
        maxMag = f.magnitude;
        pFreq = f.frequency;
      }
    });
    return { fftData: fft, windowStats: stats, peakFreq: { freq: pFreq, mag: maxMag } };
  }, [fftSourceData, accelAxis, sampleRate]);

  const handleRunAI = async () => {
    if (!windowStats || !peakFreq) return;
    setIsAnalyzing(true);
    const result = await analyzeWithGemini(
      { ...windowStats, axis: accelAxis }, 
      peakFreq
    );
    setAiResult(result);
    setIsAnalyzing(false);
  };

  const handleChartClick = (clickedTime: number) => {
    if (!finalProcessedData) return;
    const maxStart = finalProcessedData[finalProcessedData.length - 1].time - windowSize;
    let newStart = clickedTime - (windowSize / 2);
    if (newStart < 0) newStart = 0;
    if (newStart > maxStart) newStart = maxStart;
    setWindowStart(newStart);
  };
  
  const handleZoom = (left: number, right: number) => {
    if (left === right) return;
    setViewDomain([left, right]);
  };
  
  const resetView = () => setViewDomain(null);
  const handleResetLayout = () => { setIsFFTVisible(true); resetView(); };
  const focusWindow = () => setViewDomain([windowStart, windowStart + windowSize]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveImage = async () => {
    const container = exportContainerRef.current;
    if (!container || !(window as any).html2canvas) return;
    
    setIsAnalyzing(true);
    
    // Allow a brief moment for the hidden container to fully render charts
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Determine background color based on theme
      let bgColor = '#030712'; // Default dark
      if (currentThemeId === 'pure-white') bgColor = '#ffffff';
      else if (currentThemeId === 'engineering') bgColor = '#fefce8';
      else if (currentThemeId === 'antigravity') bgColor = '#020617';

      const canvas = await (window as any).html2canvas(container, {
        backgroundColor: bgColor,
        scale: 2, 
        useCORS: true,
        logging: false,
        height: container.scrollHeight,
        windowHeight: container.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `MESE_Vibration_Analysis_${fileName.split('.')[0] || 'Report'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setShowExportModal(false);
    } catch (err) {
      console.error("Export failed:", err);
      alert("报告保存失败，请检查浏览器设置或尝试直接打印。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseDomain = (min: string, max: string): [number | 'auto', number | 'auto'] => {
    const pMin = min === '' || isNaN(Number(min)) ? 'auto' : Number(min);
    const pMax = max === '' || isNaN(Number(max)) ? 'auto' : Number(max);
    return [pMin, pMax];
  };

  const applyIsoPreset = () => {
    setFilterConfig({
      enabled: true, highPassFreq: 0, lowPassFreq: 10, isStandardWeighting: true, targetAxes: 'all', enableKalman: false, kalmanQ: 0.01, kalmanR: 1.0
    });
  };

  const resetFilters = () => {
    setFilterConfig({
      enabled: false, highPassFreq: 0, lowPassFreq: 30, isStandardWeighting: false, targetAxes: 'all', enableKalman: false, kalmanQ: 0.01, kalmanR: 1.0
    });
  };

  const maxTime = finalProcessedData ? finalProcessedData[finalProcessedData.length - 1].time : 0;

  if (!finalProcessedData) {
    return (
      <div className={`h-screen w-screen ${theme.bgApp} flex flex-col relative overflow-hidden`}>
        <div className="absolute top-4 right-4 z-50">
          <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="text-white bg-gray-800 px-3 py-1 rounded text-sm border border-gray-700">
            {lang === 'zh' ? 'EN' : '中文'}
          </button>
        </div>
        <FileUpload onDataLoaded={handleFileLoad} />
        <div className="absolute bottom-8 text-center w-full text-gray-500 text-xs px-4">
           <p className="mb-1">{t.dragDrop}</p>
           <p className="mb-3">{t.systemInfo}</p>
           <p className="text-gray-400 opacity-80 max-w-lg mx-auto leading-relaxed">{t.smecInfo}</p>
        </div>
      </div>
    );
  }

  const currentViewStart = viewDomain ? viewDomain[0] : 0;
  const currentViewEnd = viewDomain ? viewDomain[1] : maxTime;

  return (
    <div className={`h-screen w-screen ${theme.bgApp} ${theme.textPrimary} font-sans flex flex-col overflow-hidden`}>
      {/* --- HIDDEN EXPORT CONTAINER (OFF-SCREEN) --- */}
      {/* Performance Fix: Render contents strictly when modal is open */}
      <div 
        ref={exportContainerRef}
        className={`fixed top-0 left-[-9999px] w-[1000px] ${theme.bgApp} ${theme.textPrimary} p-8 z-[-1]`}
        style={{ visibility: 'visible' }} 
      >
        {showExportModal && (
          <>
            <div className="mb-8 border-b border-gray-700 pb-4">
              <h1 className="text-3xl font-bold mb-2">{t.reportTitle}</h1>
              <p className="text-sm opacity-70">{t.reportFile}: {fileName} | {t.reportDate}: {new Date().toLocaleString()}</p>
            </div>

            {/* --- ISO STATISTICS TABLE --- */}
            <div className="mb-8 border border-gray-700 rounded-xl overflow-hidden bg-gray-900/50 p-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span> {t.globalStats}
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="font-bold text-gray-400 border-b border-gray-700 pb-2">{t.reportMetric}</div>
                  <div className="font-bold text-red-400 border-b border-gray-700 pb-2">{t.reportAxisX}</div>
                  <div className="font-bold text-green-400 border-b border-gray-700 pb-2">{t.reportAxisY}</div>
                  <div className="font-bold text-blue-400 border-b border-gray-700 pb-2">{t.reportAxisZ}</div>
                  
                  {/* Row 1: A95 */}
                  <div className="text-gray-300 py-1">{t.a95} ({t.t1t2})</div>
                  <div className="font-mono py-1">{isoStats?.x.constVel.a95.toFixed(3)}</div>
                  <div className="font-mono py-1">{isoStats?.y.constVel.a95.toFixed(3)}</div>
                  <div className="font-mono py-1">{isoStats?.z.constVel.a95.toFixed(3)}</div>

                  {/* Row 2: Pk-Pk Const Vel */}
                  <div className="text-gray-300 py-1">{t.maxPkPk} ({t.t1t2})</div>
                  <div className="font-mono py-1">{isoStats?.x.constVel.pkPk.toFixed(3)}</div>
                  <div className="font-mono py-1">{isoStats?.y.constVel.pkPk.toFixed(3)}</div>
                  <div className="font-mono py-1">{isoStats?.z.constVel.pkPk.toFixed(3)}</div>

                  {/* Row 3: 0-Pk Const Vel (New Feature) */}
                  <div className="text-gray-300 py-1">{t.max0Pk} ({t.t1t2})</div>
                  <div className="font-mono py-1">{isoStats?.x.constVel.zeroPk.toFixed(3)}</div>
                  <div className="font-mono py-1">{isoStats?.y.constVel.zeroPk.toFixed(3)}</div>
                  <div className="font-mono py-1">{isoStats?.z.constVel.zeroPk.toFixed(3)}</div>

                  {/* Row 4: Pk-Pk Total */}
                  <div className="text-gray-300 py-1">{t.maxPkPk} ({t.t0t3})</div>
                  <div className="font-mono text-gray-500 py-1">-</div>
                  <div className="font-mono text-gray-500 py-1">-</div>
                  <div className="font-mono text-yellow-500 py-1">{isoStats?.z.global?.pkPk.toFixed(3)}</div>
              </div>
            </div>

            {/* 1. Vibration Section (3 Charts) */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-l-4 border-blue-500 pl-3">{t.reportVibTitle}</h2>
              <div className="space-y-4">
                <div className="relative h-[200px] border border-gray-800 rounded p-2 bg-gray-900/50">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold opacity-70">X-Axis (AX)</p>
                    {/* Added 0-Pk to headers */}
                    <p className="text-[10px] font-mono opacity-60">A95: {isoStats?.x.constVel.a95.toFixed(2)} | Pk-Pk: {isoStats?.x.constVel.pkPk.toFixed(2)} | 0-Pk: {isoStats?.x.constVel.zeroPk.toFixed(2)}</p>
                  </div>
                  <TimeChart data={displayData} axis="ax" color={theme.chartColors.ax} windowRange={{ start: windowStart, end: windowStart + windowSize }} gridColor={theme.gridColor} textColor={theme.textColorHex} />
                </div>
                <div className="relative h-[200px] border border-gray-800 rounded p-2 bg-gray-900/50">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold opacity-70">Y-Axis (AY)</p>
                    <p className="text-[10px] font-mono opacity-60">A95: {isoStats?.y.constVel.a95.toFixed(2)} | Pk-Pk: {isoStats?.y.constVel.pkPk.toFixed(2)} | 0-Pk: {isoStats?.y.constVel.zeroPk.toFixed(2)}</p>
                  </div>
                  <TimeChart data={displayData} axis="ay" color={theme.chartColors.ay} windowRange={{ start: windowStart, end: windowStart + windowSize }} gridColor={theme.gridColor} textColor={theme.textColorHex} />
                </div>
                <div className="relative h-[200px] border border-gray-800 rounded p-2 bg-gray-900/50">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold opacity-70">Z-Axis (AZ)</p>
                    <p className="text-[10px] font-mono opacity-60">A95: {isoStats?.z.constVel.a95.toFixed(2)} | Pk-Pk: {isoStats?.z.constVel.pkPk.toFixed(2)} | 0-Pk: {isoStats?.z.constVel.zeroPk.toFixed(2)}</p>
                  </div>
                  <TimeChart data={displayData} axis="az" color={theme.chartColors.az} windowRange={{ start: windowStart, end: windowStart + windowSize }} gridColor={theme.gridColor} textColor={theme.textColorHex} verticalLines={isoVerticalLines} highlightAreas={isoHighlightAreas} />
                </div>
              </div>
            </div>

            {/* 2. FFT Section (3 Charts) */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-l-4 border-purple-500 pl-3">{t.reportFftTitle}</h2>
              <div className="flex flex-col gap-4">
                {allFFTs && (
                  <>
                    <div className="relative h-[250px] w-full border border-gray-800 rounded p-2 bg-gray-900/50">
                      <p className="text-xs font-bold mb-1 opacity-70">X-Axis FFT</p>
                      <FFTChart data={allFFTs.ax} color={theme.chartColors.ax} gridColor={theme.gridColor} textColor={theme.textColorHex} mode={fftMode} theoreticalFreqs={theoFreqs} />
                    </div>
                    <div className="relative h-[250px] w-full border border-gray-800 rounded p-2 bg-gray-900/50">
                      <p className="text-xs font-bold mb-1 opacity-70">Y-Axis FFT</p>
                      <FFTChart data={allFFTs.ay} color={theme.chartColors.ay} gridColor={theme.gridColor} textColor={theme.textColorHex} mode={fftMode} theoreticalFreqs={theoFreqs} />
                    </div>
                    <div className="relative h-[250px] w-full border border-gray-800 rounded p-2 bg-gray-900/50">
                      <p className="text-xs font-bold mb-1 opacity-70">Z-Axis FFT</p>
                      <FFTChart data={allFFTs.az} color={theme.chartColors.az} gridColor={theme.gridColor} textColor={theme.textColorHex} mode={fftMode} theoreticalFreqs={theoFreqs} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Kinematics Section (2 Charts) */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 border-l-4 border-orange-500 pl-3">{t.reportKinTitle}</h2>
              <div className="space-y-4">
                <div className="relative h-[200px] border border-gray-800 rounded p-2 bg-gray-900/50">
                  <p className="text-xs font-bold mb-1 opacity-70">Velocity (VZ)</p>
                  <TimeChart data={displayData} axis="vz" color={theme.chartColors.vz} windowRange={{ start: windowStart, end: windowStart + windowSize }} gridColor={theme.gridColor} textColor={theme.textColorHex} verticalLines={isoVerticalLines} />
                </div>
                <div className="relative h-[200px] border border-gray-800 rounded p-2 bg-gray-900/50">
                  <p className="text-xs font-bold mb-1 opacity-70">Displacement (SZ)</p>
                  <TimeChart data={displayData} axis="sz" color={theme.chartColors.sz} windowRange={{ start: windowStart, end: windowStart + windowSize }} gridColor={theme.gridColor} textColor={theme.textColorHex} verticalLines={isoVerticalLines} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <header className={`flex-none border-b ${theme.border} ${theme.bgCard} backdrop-blur-md z-50 print:hidden`}>
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1 rounded hover:bg-white/10 ${theme.textSecondary}`} title={t.toggleSidebar}>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-black tracking-tighter flex items-center shrink-0">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400 drop-shadow-sm mr-2">MESE</span> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400 drop-shadow-sm mr-2">ELEVATOR</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 drop-shadow-sm">VIBRATION ANALYSIS</span>
            </h1>
            <div className="h-4 w-px bg-gray-600 shrink-0 mx-1"></div>
            <span 
              className={`text-sm ${theme.textSecondary} font-mono truncate max-w-[450px] flex-shrink`} 
              title={fileName}
            >
              {fileName}
            </span>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => setShowExportModal(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border ${theme.border} hover:bg-white/10`}>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               {t.export}
            </button>
            <div className="h-4 w-px bg-gray-600"></div>
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className={`text-xs font-bold px-2 py-1 rounded border ${theme.border} ${theme.textPrimary} hover:bg-white/5`}>{lang === 'zh' ? 'EN' : '中文'}</button>
            <div className="h-4 w-px bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <span className={`text-xs uppercase font-bold ${theme.textSecondary}`}>{t.theme}</span>
              <select value={currentThemeId} onChange={(e) => setCurrentThemeId(e.target.value)} className={`text-xs p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}>
                {THEMES.map(t => <option key={t.id} value={t.id} className="bg-gray-900 text-gray-100">{t.name}</option>)}
              </select>
            </div>
            <div className="h-4 w-px bg-gray-600"></div>
            <button onClick={() => { setRawData(null); setFinalProcessedData(null); }} className={`text-sm ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}>{t.close}</button>
          </div>
        </div>
      </header>

      {/* --- THEORETICAL FREQS MODAL --- */}
      {showTheoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className={`${theme.bgPanel} border ${theme.border} rounded-xl shadow-2xl p-6 w-96`}>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold">{t.theoModalTitle}</h3>
               <button onClick={() => setShowTheoModal(false)} className="text-gray-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-xs font-bold ${theme.textSecondary} mb-1`}>{t.machineModel}</label>
                <select 
                  value={selectedMachine} 
                  onChange={(e) => setSelectedMachine(e.target.value)} 
                  className={`w-full text-sm p-2 rounded border ${theme.border} bg-gray-900 ${theme.textPrimary}`}
                >
                  {machineSpecs.map((m, idx) => (
                    <option key={idx} value={m.model}>{m.model} ({m.type})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-xs font-bold ${theme.textSecondary} mb-1`}>{t.speed}</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={ratedSpeed} 
                  onChange={(e) => setRatedSpeed(parseFloat(e.target.value))} 
                  className={`w-full text-sm p-2 rounded border ${theme.border} bg-gray-900 ${theme.textPrimary}`} 
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${theme.textSecondary} mb-1`}>{t.ropeType}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRopeType('normal')}
                    className={`flex-1 py-2 text-xs rounded border ${ropeType === 'normal' ? `${theme.border} bg-indigo-600 text-white` : `${theme.border} bg-gray-900 ${theme.textSecondary}`}`}
                  >
                    {t.normalRope}
                  </button>
                  <button 
                    onClick={() => setRopeType('sflex')}
                    className={`flex-1 py-2 text-xs rounded border ${ropeType === 'sflex' ? `${theme.border} bg-indigo-600 text-white` : `${theme.border} bg-gray-900 ${theme.textSecondary}`}`}
                  >
                    {t.sflexRope}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
               <button onClick={() => { setShowTheoLines(true); setShowTheoModal(false); }} className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold transition-colors">{t.showTable}</button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className={`${theme.bgPanel} border ${theme.border} rounded-xl shadow-2xl p-6 w-80`}>
            <h3 className="text-lg font-bold mb-4">{t.exportTitle}</h3>
            <div className="space-y-3 mb-6">
               <div className="text-xs text-gray-500 italic mb-2">* {lang === 'zh' ? '保存报告将包含 AX, AY, AZ, FFT, VZ, SZ 完整内容。' : 'Report will include AX, AY, AZ, FFT, VZ, SZ content.'}</div>
               <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={exportSelection.vibration} onChange={e => setExportSelection({...exportSelection, vibration: e.target.checked})}/><span className="text-sm">{t.vibration}</span></label>
               <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={exportSelection.fft} onChange={e => setExportSelection({...exportSelection, fft: e.target.checked})}/><span className="text-sm">{t.fft}</span></label>
               <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={exportSelection.kinematics} onChange={e => setExportSelection({...exportSelection, kinematics: e.target.checked})}/><span className="text-sm">{t.kinematics}</span></label>
            </div>
            <div className="space-y-2">
              <button onClick={handlePrint} className={`w-full py-2 rounded font-bold ${theme.bgCard} border ${theme.border} hover:bg-white/5`}>{t.print}</button>
              <button onClick={handleSaveImage} disabled={isAnalyzing} className={`w-full py-2 rounded font-bold bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50`}>
                {isAnalyzing ? t.analyzing : t.saveImage}
              </button>
              <button onClick={() => setShowExportModal(false)} className={`w-full py-2 rounded text-sm ${theme.textSecondary} hover:text-white`}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        <aside className={`${isSidebarOpen ? 'w-full lg:w-80 translate-x-0' : 'w-0 -translate-x-full hidden'} ${theme.bgPanel} border-r ${theme.border} flex flex-col z-40 shrink-0 transition-all duration-300 print:hidden h-full overflow-y-auto`}>
          <div className="p-6 space-y-6 pb-20">
            {/* ... Existing Sidebar Content ... */}
            
            <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
              <div className="flex justify-between items-center mb-3"><h3 className={`text-xs font-bold ${theme.textSecondary} uppercase flex items-center gap-2`}><span className={`w-1.5 h-1.5 rounded-full ${theme.accent.replace('text-', 'bg-')}`}></span>{t.globalStats} ({accelAxis.toUpperCase()})</h3><label className="flex items-center gap-2 cursor-pointer"><span className={`text-[10px] ${theme.textSecondary}`}>{t.showBoundaries}</span><input type="checkbox" checked={showIsoBoundaries} onChange={(e) => setShowIsoBoundaries(e.target.checked)} className="rounded border-gray-600 bg-gray-800 focus:ring-0 w-3 h-3"/></label></div>
              {isoStats && (
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-[10px] font-bold ${theme.textSecondary} border-b ${theme.border} mb-2`}>{t.t1t2}</h4>
                    <div className="space-y-1">
                       <div className="flex justify-between text-xs"><span>{t.a95}</span><span className="font-mono">{(accelAxis==='az'?isoStats.z:accelAxis==='ax'?isoStats.x:isoStats.y).constVel.a95.toFixed(3)}</span></div>
                       <div className="flex justify-between text-xs"><span>{t.maxPkPk}</span><span className="font-mono">{(accelAxis==='az'?isoStats.z:accelAxis==='ax'?isoStats.x:isoStats.y).constVel.pkPk.toFixed(3)}</span></div>
                       <div className="flex justify-between text-xs"><span>{t.max0Pk}</span><span className="font-mono">{(accelAxis==='az'?isoStats.z:accelAxis==='ax'?isoStats.x:isoStats.y).constVel.zeroPk.toFixed(3)}</span></div>
                    </div>
                  </div>
                  {accelAxis === 'az' && isoStats.z.global && (
                    <div><h4 className={`text-[10px] font-bold ${theme.textSecondary} border-b ${theme.border} mb-2 mt-2`}>{t.t0t3}</h4><div className="space-y-1"><div className="flex justify-between text-xs font-bold text-yellow-500"><span>{t.maxPkPk}</span><span className="font-mono">{isoStats.z.global.pkPk.toFixed(3)}</span></div><div className="flex justify-between text-xs"><span>{t.max0Pk}</span><span className="font-mono">{isoStats.z.global.zeroPk.toFixed(3)}</span></div></div></div>
                  )}
                </div>
              )}
              <div className="text-[10px] text-gray-500 mt-3 opacity-80 italic">{t.globalStatsNote}</div>
            </div>

            {windowStats && (
              <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
                <div className="flex justify-between items-center mb-3"><h3 className={`text-xs font-bold ${theme.textSecondary} uppercase flex items-center gap-2`}><span className={`w-1.5 h-1.5 rounded-full bg-purple-500`}></span>{t.windowAnalysis}</h3>{!isFFTVisible && <button onClick={() => setIsFFTVisible(true)} className="text-[10px] px-2 py-1 rounded bg-purple-600 text-white shadow hover:bg-purple-500 transition-colors font-bold">{t.showChart}</button>}</div>
                <div className="space-y-2">
                   <div className={`flex justify-between items-center border-b ${theme.border} pb-1`}><span className={`text-xs ${theme.textSecondary}`}>{t.rms}</span><span className="font-mono text-sm">{windowStats.rms.toFixed(3)}</span></div>
                   <div className={`flex justify-between items-center border-b ${theme.border} pb-1`}><span className={`text-xs ${theme.textSecondary}`}>{t.peak}</span><span className="font-mono text-sm">{windowStats.peakVal.toFixed(3)}</span></div>
                   <div className={`flex justify-between items-center border-b ${theme.border} pb-1`}><span className={`text-xs ${theme.textSecondary}`}>{t.dominant}</span><span className="font-mono text-sm text-yellow-500">{peakFreq?.freq.toFixed(2)} Hz</span></div>
                   <div className="flex justify-between items-center pt-1"><span className={`text-xs ${theme.textSecondary}`}>{t.magnitude}</span><span className="font-mono text-sm">{peakFreq ? (peakFreq.mag * 1.4142).toFixed(4) : '0.0000'}</span></div>
                </div>
              </div>
            )}

            <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
              <div className="flex p-0.5 rounded-lg bg-black/20 border border-white/5 mb-4">
                <button 
                  onClick={() => setFftMode('window')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${fftMode === 'window' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {t.windowControl}
                </button>
                <button 
                  onClick={() => setFftMode('constVel')}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${fftMode === 'constVel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  {t.constVelFFT}
                </button>
              </div>

              {fftMode === 'window' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                  <label className={`text-[10px] font-bold ${theme.textSecondary} uppercase tracking-wider block`}>{t.windowControl}</label>
                  <input type="range" min={0} max={maxTime - windowSize} step={0.1} value={windowStart} onChange={(e) => setWindowStart(Number(e.target.value))} className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${theme.bgCard}`}/>
                  <div className="flex justify-between text-xs font-mono"><span>{windowStart.toFixed(2)}s</span><span>{(windowStart + windowSize).toFixed(2)}s</span></div>
                  <div className="flex gap-2">{[1, 2, 4, 8].map(ws => <button key={ws} onClick={() => setWindowSize(ws)} className={`flex-1 py-1 text-xs rounded border ${windowSize === ws ? `${theme.border} ${theme.accent} font-bold bg-opacity-10` : `${theme.border} ${theme.textSecondary}`}`}>{ws}s</button>)}</div>
                </div>
              ) : (
                <div className="p-4 text-center border border-dashed border-indigo-500/30 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300 bg-indigo-500/5">
                  <p className="text-[10px] text-indigo-400 font-bold mb-1 uppercase">{t.constVelFFT}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed italic">{lang === 'zh' ? '正在对匀速阶段 (t1-t2) 进行完整频谱分析' : 'Analyzing full duration of constant velocity phase (t1-t2)'}</p>
                  {boundaries && boundaries.isValid && (
                    <p className="text-[9px] text-gray-400 mt-2 font-mono">{boundaries.t1.toFixed(2)}s ~ {boundaries.t2.toFixed(2)}s</p>
                  )}
                </div>
              )}
            </div>

            <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
              <div className="flex justify-between items-center mb-3"><h3 className={`text-xs font-bold ${theme.textSecondary} uppercase flex items-center gap-2`}><span className={`w-1.5 h-1.5 rounded-full bg-blue-500`}></span>{t.dsp}</h3><label className="flex items-center gap-2 cursor-pointer"><span className="text-[10px] font-bold">{t.enableFilter}</span><input type="checkbox" checked={filterConfig.enabled} onChange={(e) => setFilterConfig({...filterConfig, enabled: e.target.checked})} className="rounded border-gray-600 bg-gray-800"/></label></div>
              <div className={`space-y-3 ${!filterConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1">{t.highPass}</label><input type="number" value={filterConfig.highPassFreq} onChange={(e) => setFilterConfig({...filterConfig, highPassFreq: Number(e.target.value)})} className={`w-full text-xs p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}/></div><div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1">{t.lowPass}</label><input type="number" value={filterConfig.lowPassFreq} onChange={(e) => setFilterConfig({...filterConfig, lowPassFreq: Number(e.target.value)})} className={`w-full text-xs p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}/></div></div>
                <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1">{t.target}</label><select value={filterConfig.targetAxes} onChange={(e) => setFilterConfig({...filterConfig, targetAxes: e.target.value as 'all' | 'z-only'})} className={`w-full text-xs p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}><option value="all" className="bg-gray-900 text-gray-100">{t.targetAll}</option><option value="z-only" className="bg-gray-900 text-gray-100">{t.targetZ}</option></select></div></div>
                <div className={`border-t ${theme.border} pt-2 mt-2`}><div className="flex justify-between items-center mb-2"><span className={`text-[10px] font-bold ${theme.accent}`}>{t.kalman}</span><input type="checkbox" checked={filterConfig.enableKalman} onChange={(e) => setFilterConfig({...filterConfig, enableKalman: e.target.checked})} className="rounded border-gray-600 bg-gray-800 w-3 h-3"/></div>{filterConfig.enableKalman && <div className="space-y-2 pl-1"><div><label className="flex justify-between text-[10px] text-gray-500 mb-1"><span>{t.kalmanQ}</span><span>{filterConfig.kalmanQ}</span></label><input type="range" min="0.0001" max="0.1" step="0.0001" value={filterConfig.kalmanQ} onChange={(e) => setFilterConfig({...filterConfig, kalmanQ: Number(e.target.value)})} className={`w-full h-1 rounded-lg appearance-none cursor-pointer bg-gray-700`}/></div><div><label className="flex justify-between text-[10px] text-gray-500 mb-1"><span>{t.kalmanR}</span><span>{filterConfig.kalmanR}</span></label><input type="range" min="0.1" max="10.0" step="0.1" value={filterConfig.kalmanR} onChange={(e) => setFilterConfig({...filterConfig, kalmanR: Number(e.target.value)})} className={`w-full h-1 rounded-lg appearance-none cursor-pointer bg-gray-700`}/></div></div>}</div>
                <div className="flex gap-2 pt-1 border-t border-gray-800"><button onClick={applyIsoPreset} className={`flex-1 py-1 px-2 text-[10px] rounded border ${theme.border} hover:bg-white/10 ${filterConfig.isStandardWeighting && filterConfig.enabled ? theme.accent : ''}`}>{t.presetIso}</button><button onClick={resetFilters} className={`py-1 px-2 text-[10px] rounded border ${theme.border} hover:bg-white/10`}>{t.presetDefault}</button></div>
              </div>
            </div>

             <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
              <div className="flex justify-between items-center mb-3"><h3 className={`text-xs font-bold ${theme.textSecondary} uppercase flex items-center gap-2`}><span className={`w-1.5 h-1.5 rounded-full bg-green-500`}></span>{t.viewControl}</h3></div>
              <div className="space-y-3"><div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1">{t.viewStart}</label><input type="number" min="0" max={maxTime} step="0.1" value={currentViewStart.toFixed(2)} onChange={(e) => { const val = Number(e.target.value); setViewDomain([val, Math.max(val + 0.1, currentViewEnd)]); }} className={`w-full text-xs p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}/></div><div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1">{t.viewEnd}</label><input type="number" min="0" max={maxTime} step="0.1" value={currentViewEnd.toFixed(2)} onChange={(e) => { const val = Number(e.target.value); setViewDomain([Math.min(val - 0.1, currentViewStart), val]); }} className={`w-full text-xs p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}/></div></div><div className="flex flex-wrap gap-2"><button onClick={focusWindow} className={`flex-1 py-1 px-2 text-[10px] rounded border ${theme.border} hover:bg-white/10`}>{t.focusWindow}</button><button onClick={handleResetLayout} className={`flex-1 py-1 px-2 text-[10px] rounded border ${theme.border} hover:bg-white/10`}>{t.resetLayout}</button></div><p className="text-[10px] text-gray-500 italic text-center">{t.zoomTip}</p></div>
            </div>

            <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}><label className={`text-xs font-bold ${theme.textSecondary} uppercase tracking-wider mb-3 block`}>{t.chartHeight} ({chartHeight}px)</label><input type="range" min="200" max="600" step="50" value={chartHeight} onChange={(e) => setChartHeight(Number(e.target.value))} className="w-full"/></div>

            <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
              <h3 className={`text-xs font-bold ${theme.textSecondary} uppercase flex items-center gap-2 mb-3`}><span className={`w-1.5 h-1.5 rounded-full bg-orange-500`}></span>{t.dataSettings}</h3>
              <div className="space-y-3">
                 <div>
                    <label className="text-[10px] text-gray-500 block mb-1">{t.sampleRate}</label>
                    <div className="flex gap-2">
                      <input type="number" min="1" max="10000" value={sampleRate} onChange={(e) => setSampleRate(Number(e.target.value))} className={`w-full text-xs p-1.5 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}/>
                      <select value="" onChange={(e) => { if(e.target.value) setSampleRate(Number(e.target.value)); }} className={`w-20 text-xs p-1.5 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}>
                        <option value="" className="bg-gray-900 text-gray-100">Pre...</option>
                        <option value="5000" className="bg-gray-900 text-gray-100">5000</option>
                        <option value="4096" className="bg-gray-900 text-gray-100">4096</option>
                        <option value="2048" className="bg-gray-900 text-gray-100">2048</option>
                        <option value="2000" className="bg-gray-900 text-gray-100">2000</option>
                        <option value="1600" className="bg-gray-900 text-gray-100">1600</option>
                        <option value="1024" className="bg-gray-900 text-gray-100">1024</option>
                        <option value="1000" className="bg-gray-900 text-gray-100">1000</option>
                        <option value="800" className="bg-gray-900 text-gray-100">800</option>
                        <option value="512" className="bg-gray-900 text-gray-100">512</option>
                        <option value="500" className="bg-gray-900 text-gray-100">500</option>
                        <option value="256" className="bg-gray-900 text-gray-100">256</option>
                        <option value="250" className="bg-gray-900 text-gray-100">250</option>
                        <option value="128" className="bg-gray-900 text-gray-100">128</option>
                        <option value="125" className="bg-gray-900 text-gray-100">125</option>
                      </select>
                    </div>
                 </div>
                 <p className="text-[10px] text-gray-500 italic leading-tight">{t.sampleRateNote}</p>
              </div>
            </div>

             <div className={`${theme.bgCard} rounded-xl p-4 border ${theme.border} shadow-sm`}>
                <button 
                  onClick={handleRunAI} 
                  disabled={isAnalyzing} 
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isAnalyzing ? 'bg-gray-800 text-gray-400 cursor-wait' : 'bg-gradient-to-r from-teal-600 to-indigo-600 text-white shadow-lg active:scale-95'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
                  {isAnalyzing ? t.analyzing : t.aiDiag}
                </button>
                {aiResult && (
                  <div className={`mt-4 pt-4 border-t ${theme.border} animate-in fade-in duration-500`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${aiResult.status === 'safe' ? 'bg-green-500/20 text-green-400' : aiResult.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {aiResult.status}
                      </span>
                    </div>
                    <p className={`text-xs ${theme.textSecondary} mb-3 italic leading-relaxed`}>{aiResult.summary}</p>
                    <div className="space-y-1">
                      {aiResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-2 text-[10px] text-gray-300">
                          <span className="text-teal-500">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
            <div className="mt-4 text-[10px] text-center text-gray-500 font-mono">{t.creator}</div>
          </div>
        </aside>

        <div ref={chartsContainerRef} className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto h-full min-w-0 print:w-full print:h-auto print:overflow-visible">
            {exportSelection.vibration && (
            <div className={`${theme.bgCard} border ${theme.border} rounded-xl p-4 shadow-sm flex flex-col shrink-0`} style={{ height: chartHeight }}>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2`}><span className="w-2 h-2 rounded-sm" style={{backgroundColor: theme.chartColors[accelAxis]}}></span>{t.vibration}{filterConfig.enabled && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded ml-1">Filtered</span>}</h2>
                  <div className={`flex rounded border ${theme.border} p-0.5 print:hidden`}>{['ax', 'ay', 'az'].map((ax) => <button key={ax} onClick={() => setAccelAxis(ax as DataAxis)} className={`px-2 py-0.5 text-xs font-bold rounded ${accelAxis === ax ? `bg-gray-500/20 ${theme.textPrimary}` : theme.textSecondary}`}>{ax.toUpperCase()}</button>)}</div>
                </div>
                <div className="flex items-center gap-3 print:hidden"><div className="flex items-center gap-1"><span className={`text-[10px] ${theme.textSecondary}`}>{t.refLines}</span><select value={refLineLevel || 0} onChange={(e) => setRefLineLevel(Number(e.target.value) || null)} className={`text-[10px] p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}><option value="0" className="bg-gray-900 text-gray-100">Off</option><option value="10" className="bg-gray-900 text-gray-100">±10</option><option value="15" className="bg-gray-900 text-gray-100">±15</option></select></div><div className="flex items-center gap-1"><span className={`text-[10px] ${theme.textSecondary}`}>{t.yScale}</span><input placeholder="Min" className={`w-12 text-[10px] p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`} value={yMinAccel} onChange={(e) => setYMinAccel(e.target.value)}/><input placeholder="Max" className={`w-12 text-[10px] p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`} value={yMaxAccel} onChange={(e) => setYMaxAccel(e.target.value)}/></div><div className={`w-px h-4 bg-gray-700 mx-1`}></div><button onClick={handleResetLayout} className={`p-1.5 rounded border ${theme.border} hover:bg-gray-500/20 ${theme.textPrimary} ml-1`} title={t.resetLayout}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button></div>
              </div>
              <div className="flex-1 min-h-0"><TimeChart data={displayData} axis={accelAxis} color={theme.chartColors[accelAxis]} syncId="timeSync" windowRange={{ start: windowStart, end: windowStart + windowSize }} onChartClick={handleChartClick} globalStats={currentGlobalStats} referenceLines={refLineLevel ? [refLineLevel, -refLineLevel] : undefined} verticalLines={isoVerticalLines} highlightAreas={isoHighlightAreas} yDomain={parseDomain(yMinAccel, yMaxAccel)} xDomain={viewDomain || undefined} onZoom={handleZoom} gridColor={theme.gridColor} textColor={theme.textColorHex} brushColor={theme.brushColor}/></div>
            </div>
            )}

            {exportSelection.fft && isFFTVisible && (
            <div className={`${theme.bgCard} border ${theme.border} rounded-xl p-4 shadow-sm flex flex-col shrink-0`} style={{ height: chartHeight }}>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2`}>{t.fft} ({accelAxis.toUpperCase()}) {fftMode === 'constVel' ? `(${t.constVelFFT})` : `(${t.windowAnalysis})`}</h2>
                <div className="flex items-center gap-4">
                  <span className={`text-xs ${theme.textSecondary}`}>{t.dominant}: {peakFreq?.freq.toFixed(2)}Hz</span>
                  
                  {/* Theoretical Frequency Button */}
                  <button 
                    onClick={() => {
                      if (showTheoLines) {
                        setShowTheoLines(false);
                      } else {
                        setShowTheoModal(true);
                      }
                    }}
                    className={`text-[10px] px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white shadow transition-colors font-bold ${showTheoLines ? 'ring-2 ring-teal-400' : ''}`}
                    title={showTheoLines ? t.theoreticalHide : t.theoretical}
                  >
                    {showTheoLines ? t.theoreticalHide : t.theoretical}
                  </button>

                  <button onClick={() => setIsFFTVisible(false)} className={`text-[10px] p-1 rounded hover:bg-red-500/20 hover:text-red-500 transition-colors ${theme.textSecondary}`} title={t.hideChart}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <FFTChart 
                  data={fftData} 
                  color={theme.chartColors[accelAxis]} 
                  gridColor={theme.gridColor} 
                  textColor={theme.textColorHex} 
                  mode={fftMode}
                  theoreticalFreqs={showTheoLines ? theoFreqs : null}
                />
              </div>
            </div>
            )}

            {exportSelection.kinematics && (
            <div className={`${theme.bgCard} border ${theme.border} rounded-xl p-4 shadow-sm flex flex-col shrink-0`} style={{ height: chartHeight }}>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-4"><h2 className={`text-sm font-bold ${theme.textSecondary} flex items-center gap-2`}><span className="w-2 h-2 rounded-sm" style={{backgroundColor: theme.chartColors[intAxis]}}></span>{t.kinematics}</h2><div className={`flex rounded border ${theme.border} p-0.5 print:hidden`}>{['vz', 'sz'].map((ax) => <button key={ax} onClick={() => setIntAxis(ax as DataAxis)} className={`px-2 py-0.5 text-xs font-bold rounded ${intAxis === ax ? `bg-gray-500/20 ${theme.textPrimary}` : theme.textSecondary}`}>{ax.toUpperCase()}</button>)}</div></div>
                <div className="flex items-center gap-3 print:hidden"><div className="flex items-center gap-1"><span className={`text-[10px] ${theme.textSecondary}`}>{t.refLines}</span><select value={refLineLevel || 0} onChange={(e) => setRefLineLevel(Number(e.target.value) || null)} className={`text-[10px] p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`}><option value="0" className="bg-gray-900 text-gray-100">Off</option><option value="10" className="bg-gray-900 text-gray-100">±10</option><option value="15" className="bg-gray-900 text-gray-100">±15</option></select></div><div className="flex items-center gap-1"><span className={`text-[10px] ${theme.textSecondary}`}>{t.yScale}</span><input placeholder="Min" className={`w-12 text-[10px] p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`} value={yMinInt} onChange={(e) => setYMinInt(e.target.value)}/><input placeholder="Max" className={`w-12 text-[10px] p-1 rounded border ${theme.border} bg-transparent ${theme.textPrimary}`} value={yMaxInt} onChange={(e) => setYMaxInt(e.target.value)}/></div><div className={`w-px h-4 bg-gray-700 mx-1`}></div><button onClick={handleResetLayout} className={`p-1.5 rounded border ${theme.border} hover:bg-gray-500/20 ${theme.textPrimary} ml-1`} title={t.resetLayout}><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button></div>
              </div>
              <div className="flex-1 min-h-0"><TimeChart data={displayData} axis={intAxis} color={theme.chartColors[intAxis]} syncId="timeSync" windowRange={{ start: windowStart, end: windowStart + windowSize }} onChartClick={handleChartClick} verticalLines={isoVerticalLines} highlightAreas={isoHighlightAreas} yDomain={parseDomain(yMinInt, yMaxInt)} xDomain={viewDomain || undefined} onZoom={handleZoom} gridColor={theme.gridColor} textColor={theme.textColorHex} brushColor={theme.brushColor}/></div>
            </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
