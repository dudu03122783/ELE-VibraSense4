
import { RawDataPoint } from '../types';

export interface MachineSpec {
  type: string;        // 机种
  model: string;       // 曳引机型号
  roping: number;      // 绕绳比
  sheaveD: number;     // 绳轮直径 (mm)
  slots: number;       // 槽数
  poles: number;       // 磁石数 (P)
  ropeD: number;       // 曳引绳直径 (mm)
}

export interface TheoreticalFreqs {
  f1: number; // 钢丝绳咬合
  f2: number; // 2:1 返绳轮
  f3: number; // 绳轮转动
  fs: number; // 转矩脉动 (槽数)
  f1elec: number; // 马达电频率 (1f)
  f2elec: number; // 2f
  f6elec: number; // 6f
}

const MACHINE_CSV = `机种,曳引机型号,绕绳比（X:1）,绳轮公称直径（mm）,马达槽数（个）,磁石数（个）,磁极对数(对),曳引绳直径（mm）,图号
ZQX4-W,PMF018S,2,410,54,48,24,10,NA116A430
ZQX4-W,PMF025S,2,410,54,48,24,10,NA118A894
ZS5B2,PMF011MB,1,550,72,64,32,12,NA069A555
ZS5B2,PMF027MB,1,620,72,64,32,12,NA085A918
ZS5W2,PMF027MB,1,620,72,64,32,12,NA085A918
GSXM33,PM016SR,2,410,18,60,30,10,NA116A443
MAXIEZ-M,PMF025MR,2,550,108,120,60,12,NA118A798
MAXIEZ-M,PMF040MR,2,550,108,120,60,12,NA118A798
MAXIEZ-M,PML-F25A,2,610,72,64,32,12,NA055A905
MAXIEZ-M,PML-F40A,2,610,72,64,32,12,NA055A905
MAXIEZ-W/H,PML-F34A,2,550,108,60,30,12,NA118A788
MAXIEZ-W/H,PML-F50A,2,550,108,60,30,12,NA118A788
MAXIEZ-W/H,PML-F81A,1,610,108,60,30,14,NA118A766
MRL-7,MA011G4,2,330,36,40,20,8,NA323B869 G15
MRL-7,MA6P5G4,2,330,36,40,20,8,NA323B833 G13
MRL-7,MA3P7G4,2,330,36,40,20,8,NA323B833 G11
ZPS5,PMF011MB,1,550,72,64,32,12,NA069A555
ZPS5,PMF016MB,1,550,72,64,32,12,NA097A976
ZPS5,PMF020MB,1,620,72,64,32,12,NA085A918
ZPS5,PMF027MB,1,620,72,64,32,12,NA085A918
ZQX4,PMF3P7S4,2,410,54,60,30,8,NA131A864
ZQX4,PMF011S4,2,410,54,60,30,8,NA131A864
ZQX4,PMF3P7S-E,2,410,54,60,30,8,NA131A864
ZQX4,PMF016S,2,410,54,60,30,8,NA131A864
GSX3,PM3P7SR,2,410,18,60,30,10,NA116A480
GSX3,PM6P5SR,2,410,18,60,30,10,NA116A480
GSX3,PM011SR,2,410,18,60,30,10,NA116A443
GSX3,PM015S,2,500,18,60,30,10,NA118A810
GSX3,PM021S,2,500,18,60,30,10,NA118A810`;

export const getMachineSpecs = (): MachineSpec[] => {
  const lines = MACHINE_CSV.trim().split('\n');
  const specs: MachineSpec[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 8) continue;
    specs.push({
      type: cols[0],
      model: cols[1],
      roping: Number(cols[2]),
      sheaveD: Number(cols[3]),
      slots: Number(cols[4]),
      poles: Number(cols[5]),
      ropeD: Number(cols[7])
    });
  }
  return specs;
};

export const calculateMachineFreqs = (
  spec: MachineSpec, 
  speed: number, // m/s
  ropeType: 'normal' | 'sflex'
): TheoreticalFreqs => {
  const A = ropeType === 'normal' ? 6.5 : 7.3;
  const V = speed;
  const N = spec.roping;
  const D2 = spec.sheaveD / 1000; // Convert mm to m
  const D1 = spec.ropeD / 1000;   // Convert mm to m
  const P = spec.poles;
  const Sl = spec.slots;

  // F3: 绳轮/曳引轮旋转频率 (Hz) = (V * N) / (D2 * PI)
  const f3 = (V * N) / (D2 * Math.PI);

  // F1: 钢丝绳咬合频率 (Hz) = (V * N) / (D1 * A)
  // 注意：此处 D1 为钢丝绳直径，A 为捻距系数
  const f1 = (V * N) / (D1 * A);

  // F2: 2:1 绳系吊索轮咬合频率 (Hz) = F1 / 2
  const f2 = f1 / 2;

  // FS: 转矩脉动/槽数频率 (Hz) = F3 * Slots
  const fs = f3 * Sl;

  // 1f: 马达电频率 (Hz) = (F3 * P) / 2
  const f1elec = (f3 * P) / 2;
  const f2elec = f1elec * 2;
  const f6elec = f1elec * 6;

  return { f1, f2, f3, fs, f1elec, f2elec, f6elec };
};
