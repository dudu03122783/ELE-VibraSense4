
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

Provide a concise assessment:
1. Status: safe, warning, or danger.
2. Summary: A 2-sentence explanation of the ride quality.
3. Recommendations: Bullet points on what to check (e.g., guide rails, roller guides, motor balance).
`;

export const analyzeWithGemini = async (
  stats: any, 
  fftPeak: { freq: number, mag: number },
  userApiKey?: string,
  userModelName?: string
): Promise<any> => {
  try {
    // 安全检查环境变量，防止浏览器报错
    const envKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    const apiKey = userApiKey || envKey;
    
    if (!apiKey) throw new Error("API Key missing");

    // 使用 Gemini 3 系列模型作为默认值
    const modelName = userModelName && userModelName.trim() !== '' ? userModelName : 'gemini-3-flash-preview';

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Analyze this elevator vibration data window:
    Axis: ${stats.axis}
    RMS: ${stats.rms.toFixed(4)}
    Peak Amplitude: ${stats.peakVal.toFixed(4)}
    Dominant Frequency: ${fftPeak.freq.toFixed(2)} Hz with Magnitude ${fftPeak.mag.toFixed(2)}

    Is this normal?
    `;

    const response = await ai.models.generateContent({
      model: modelName,
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
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return {
      status: 'unknown',
      summary: "AI Analysis unavailable. Check API Key.",
      recommendations: ["Check network connection", "Verify API Key"]
    };
  }
};
