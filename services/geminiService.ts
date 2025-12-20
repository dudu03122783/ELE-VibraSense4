
/**
 * Local Analysis Service (Standalone)
 * Removed external API calls and @google/genai dependencies.
 */

export const analyzeWithGemini = async (
  stats: any, 
  fftPeak: { freq: number, mag: number }
): Promise<any> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 800));

  // Diagnostic logic based on ISO 18738 standards
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  const peakVal = stats.peakVal;
  const isZ = stats.axis === 'az';
  
  // Vertical axis (Z) is typically more strictly monitored
  if (isZ) {
    if (peakVal > 30) status = 'danger';
    else if (peakVal > 20) status = 'warning';
  } else {
    if (peakVal > 15) status = 'danger';
    else if (peakVal > 10) status = 'warning';
  }

  return {
    status,
    summary: `分析完成 (本地模式)。检测到 ${stats.axis.toUpperCase()} 轴峰值为 ${peakVal.toFixed(2)} Gals。振动主频为 ${fftPeak.freq.toFixed(2)} Hz。`,
    recommendations: [
      status === 'safe' ? "当前振动数据优良，建议保持季度检查。" : "振动指标偏高，建议检查导靴张力与导轨平整度。",
      status === 'danger' ? "检测到异常振动，请检查曳引机动平衡及轿底隔离垫。" : "参考标准：ISO 18738 / GB/T 24474。"
    ]
  };
};
