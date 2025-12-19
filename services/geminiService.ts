
import { GoogleGenAI, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert Elevator Safety and Vibration Analyst. 
Your job is to analyze vibration statistics provided in JSON format and determine the safety and comfort quality of the elevator ride.
The data includes Peak-to-Peak values, RMS (Root Mean Square) values, and dominant frequencies from an FFT analysis.
Standard units: 
- Acceleration: Gals (cm/s^2) or mg. 1 Gal = 1 cm/s^2. 
- Velocity: m/s.
- Displacement: m.

ISO 18738 and other standards suggest:
- Horizontal vibration (x/y) should ideally be < 10-15 mg peak-to-peak.
- Vertical vibration (z) comfort limits vary but generally < 20-30 mg is good. 
- Low frequency (1-10Hz) vibrations are most perceptible to humans.

Provide a concise assessment in JSON format:
{
  "status": "safe" | "warning" | "danger",
  "summary": "2-sentence explanation of the quality",
  "recommendations": ["bullet point 1", "bullet point 2"]
}
`;

export const analyzeWithGemini = async (
  stats: any, 
  fftPeak: { freq: number, mag: number }
): Promise<any> => {
  try {
    // 确保 API KEY 存在
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
    if (!apiKey) {
      console.warn("API Key is missing from environment variables.");
      return {
        status: 'unknown',
        summary: "API Key 缺失，AI 分析不可用。",
        recommendations: ["请在 Zeabur 环境变量中配置 API_KEY"]
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Analyze this elevator vibration data window:
    Axis: ${stats.axis}
    RMS: ${stats.rms.toFixed(4)} Gals
    Peak Amplitude: ${stats.peakVal.toFixed(4)} Gals
    Dominant Frequency: ${fftPeak.freq.toFixed(2)} Hz with Magnitude ${fftPeak.mag.toFixed(4)}

    Is this normal based on ISO 18738? Return the result in the specified JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ['safe', 'warning', 'danger'] },
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ['status', 'summary', 'recommendations']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return {
      status: 'unknown',
      summary: "AI 分析过程发生错误，请检查网络或 API 配置。",
      recommendations: ["Check network connection", "Verify API_KEY settings"]
    };
  }
};
