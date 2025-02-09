export const SUPPORTED_FONTS = {
  arial: 'Arial, sans-serif',
  times: 'Times New Roman, serif',
  helvetica: 'Helvetica, sans-serif',
  georgia: 'Georgia, serif',
  verdana: 'Verdana, sans-serif',
  courier: 'Courier New, monospace',
  comic: 'Comic Sans MS, cursive',
  impact: 'Impact, sans-serif'
} as const;

// Type for the font values
export type FontFamily = typeof SUPPORTED_FONTS[keyof typeof SUPPORTED_FONTS]; 