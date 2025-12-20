
/**
 * Local Analysis Service
 * Removed all external API calls and @google/genai dependencies to resolve build issues.
 */

export const analyzeWithGemini = async (
  stats: any, 
  fftPeak: { freq: number, mag: number }
): Promise<any> => {
  // Artificial delay to maintain the visual "calculating" state in the UI
  await new Promise(resolve => setTimeout(resolve, 600));

  // Determine status based on standard elevator comfort thresholds (ISO 18738)
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  const isZ = stats.axis === 'az';
  const peakVal = stats.peakVal;
  
  // Standard comfort thresholds (Gals/mg)
  if (isZ) {
    if (peakVal > 30) status = 'danger';
    else if (peakVal > 20) status = 'warning';
  } else {
    if (peakVal > 15) status = 'danger';
    else if (peakVal > 10) status = 'warning';
  }

  return {
    status,
    summary: `自动诊断完成。当前轴 (${stats.axis.toUpperCase()}) 峰值为 ${peakVal.toFixed(2)} Gals。主频率检测到 ${fftPeak.freq.toFixed(2)} Hz。`,
    recommendations: [
      status === 'safe' ? "当前振动数据处于舒适范围内，建议保持常规保养。" : "振动幅值略高，建议检查导靴磨损情况及导轨润滑。",
      status === 'danger' ? "建议立即停梯检查曳引机动平衡或钢丝绳张力偏差。" : "分析基于本地 ISO 18738 标准算法。"
    ]
  };
};
