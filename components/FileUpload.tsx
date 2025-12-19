
import React, { useRef } from 'react';
import { parseCSV, processVibrationData } from '../utils/mathUtils';
import { ProcessedDataPoint } from '../types';

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

  return (
    <div className="flex flex-col items-center justify-center h-[85vh]">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        {/* Animated Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        
        {/* Container - Reduced padding back to normal sizes */}
        <div className="relative px-16 py-12 bg-gray-900/90 backdrop-blur-sm ring-1 ring-gray-800 rounded-2xl flex flex-col items-center justify-center space-y-6 shadow-2xl transform transition-all duration-300 group-hover:-translate-y-1">
          
          {/* Logo Image Section - Kept Large (w-52 ~ 208px, >2x original) */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img 
              src="/logo.png" 
              onError={(e) => {
                e.currentTarget.src = "https://api.dicebear.com/9.x/avataaars/svg?seed=MESE";
                e.currentTarget.onerror = null;
              }}
              alt="Upload Logo" 
              // Large size retained, padding optimized
              className="relative w-52 h-52 rounded-full border-4 border-gray-800 bg-gray-900 object-contain p-4 shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-col items-center space-y-2 text-center">
            {/* Title - Reverted to text-2xl for balance */}
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-400 drop-shadow-sm tracking-tight">
              上传 振动数据
            </span>
            
            {/* Subtitle - Reverted to smaller size */}
            <span className="text-xs font-bold text-teal-500 tracking-[0.2em] font-mono uppercase opacity-90">
              Upload Vibration Data
            </span>

            {/* Helper Text */}
            <span className="text-[10px] text-gray-500 font-mono mt-2 pt-2 border-t border-gray-800/50 w-full max-w-[150px]">
              Supports .csv (ax, ay, az)
            </span>
          </div>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept=".csv"
        className="hidden"
      />
      
      <div className="mt-12 max-w-md text-center text-gray-500 text-sm font-mono opacity-60">
        <p>Drag & Drop or Click center to Upload.</p>
        <p className="mt-2 text-xs">The system will automatically calculate Velocity (Vz) and Displacement (Sz).</p>
        <p className="mt-1 text-xs text-teal-500">Default Sample Rate: 1600 Hz</p>
      </div>
    </div>
  );
};

export default FileUpload;