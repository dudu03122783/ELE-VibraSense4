
/**
 * AI Analysis Service Stub
 * Removed external API calls to resolve deployment issues and remove API key dependencies.
 */

export const analyzeWithGemini = async (
  stats: any, 
  fftPeak: { freq: number, mag: number }
): Promise<any> => {
  // Simulate a short delay to keep the UI feedback (loading state) intact
  await new Promise(resolve => setTimeout(resolve, 800));

  // Determine a basic status based on standard thresholds locally
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  const isZ = stats.axis === 'az';
  
  if (isZ) {
    if (stats.peakVal > 30) status = 'danger';
    else if (stats.peakVal > 20) status = 'warning';
  } else {
    if (stats.peakVal > 15) status = 'danger';
    else if (stats.peakVal > 10) status = 'warning';
  }

  return {
    status,
    summary: `分析完成。当前轴 (${stats.axis.toUpperCase()}) 峰值为 ${stats.peakVal.toFixed(2)} Gals。主频位于 ${fftPeak.freq.toFixed(2)} Hz。`,
    recommendations: [
      status === 'safe' ? "数据在正常范围内，建议定期检查。" : "数据存在波动，建议检查导轨对齐及滚轮状态。",
      "本地分析模式已启用 (Local mode active)."
    ]
  };
};
