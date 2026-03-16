// MARD 官方色号库

export interface MardColor {
    id: string;   // 官方色号，如 M01
    name: string; // 颜色名称
    hex: string;  // 十六进制颜色
    rgb: [number, number, number]; // RGB值，用于计算距离
}

export const MARD_PALETTE: MardColor[] = [
    { id: 'M01', name: '白色', hex: '#ffffff', rgb: [255, 255, 255] },
    { id: 'M02', name: '黑色', hex: '#000000', rgb: [0, 0, 0] },
    { id: 'M03', name: '大红', hex: '#be002f', rgb: [190, 0, 47] },
    { id: 'M05', name: '深蓝', hex: '#004a92', rgb: [0, 74, 146] },
    { id: 'M10', name: '草绿', hex: '#7fb841', rgb: [127, 184, 65] },
    { id: 'M13', name: '柠檬黄', hex: '#ffec00', rgb: [255, 236, 0] },
    { id: 'M22', name: '浅粉', hex: '#f4b3c2', rgb: [244, 179, 194] },
    { id: 'M26', name: '浅灰', hex: '#b2b2b2', rgb: [178, 178, 178] },
    { id: 'M35', name: '肉色', hex: '#f9d2ad', rgb: [249, 210, 173] },
    { id: 'M44', name: '天蓝', hex: '#009fe3', rgb: [0, 159, 227] },
    { id: 'M51', name: '咖啡色', hex: '#6d4c41', rgb: [109, 76, 65] },
    // 你可以在这里继续添加更多 MARD 色号...
];