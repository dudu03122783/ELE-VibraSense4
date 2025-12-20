
import React, { useRef } from 'react';
import { parseCSV, processVibrationData } from '../utils/mathUtils.ts';
import { ProcessedDataPoint } from '../types.ts';

interface FileUploadProps {
  onDataLoaded: (data: ProcessedDataPoint[], fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      // Use default 1600 for initial load, can be changed in app later
      const raw = parseCSV(text, 1600);
      const processed = processVibrationData(raw, 1600);
      onDataLoaded(processed, file.name);
    } catch (e: any) {
      alert(`Error parsing CSV: ${e.message || "Unknown error"}\nPlease ensure columns 'ax', 'ay', 'az' exist.`);
    }
  };

  const loadDemoData = () => {
    const fs = 1600;
    const duration = 12; // 12 seconds run
    const n = fs * duration;
    const demo: any[] = [];
    
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      // Simulated elevator curve (Acceleration -> Constant Velocity -> Deceleration)
      let baseAz = 0;
      if (t < 2.5) baseAz = 40 * Math.sin(Math.PI * t / 2.5); // Accel
      else if (t > 9.5) baseAz = -40 * Math.sin(Math.PI * (t - 9.5) / 2.5); // Decel
      
      const vibration = (Math.random() - 0.5) * 5 + Math.sin(2 * Math.PI * 15 * t) * 3;
      
      demo.push({
        time: t,
        ax: (Math.random() - 0.5) * 3 + Math.sin(2 * Math.PI * 2 * t) * 1.5,
        ay: (Math.random() - 0.5) * 3 + Math.sin(2 * Math.PI * 3 * t) * 1.2,
        az: baseAz + vibration
      });
    }
    
    // Process to get proper Vz/Sz calculation
    const processed = processVibrationData(demo, fs);
    onDataLoaded(processed, "Demo_Elevator_Ride.csv");
  };

  return (
    <div className="flex flex-col items-center justify-center h-[85vh]">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative px-16 py-12 bg-gray-900/90 backdrop-blur-sm ring-1 ring-gray-800 rounded-2xl flex flex-col items-center justify-center space-y-6 shadow-2xl transform transition-all duration-300 group-hover:-translate-y-1">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img 
              src="/logo.png"
              alt="MESE Logo" 
              className="relative w-52 h-52 rounded-full border-4 border-gray-800 bg-gray-950 object-contain p-4 shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col items-center space-y-2 text-center">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-400 drop-shadow-sm tracking-tight">
              上传 振动数据
            </span>
            <span className="text-xs font-bold text-teal-500 tracking-[0.2em] font-mono uppercase opacity-90">
              UPLOAD VIBRATION DATA
            </span>
            <span className="text-[10px] text-gray-500 font-mono mt-2 pt-2 border-t border-gray-800/50 w-full max-w-[150px]">
              Supports .csv (ax, ay, az)
            </span>
          </div>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} accept=".csv" className="hidden" />
      
      <div className="mt-8 flex flex-col items-center gap-4">
        <button 
          onClick={loadDemoData}
          className="px-8 py-2.5 rounded-full border border-gray-700 bg-gray-900/50 hover:bg-gray-800 text-gray-300 text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          加载示例数据 (Load Demo)
        </button>
        <div className="max-w-md text-center text-gray-500 text-xs font-mono opacity-60">
          <p>Drag & Drop or Click center to Upload.</p>
          <p className="mt-1 text-teal-500">Default Sample Rate: 1600 Hz</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
