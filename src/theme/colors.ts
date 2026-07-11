import useAppStore from '../store/useAppStore';

const LightTheme = {
  background: '#F8F9FC',          // Soft cool off-white / light slate
  surface: '#FFFFFF',             // Pure White
  surfaceLight: '#F1F3F9',        // Slate Tint White
  primary: '#8A3FFC',             // Electric Amethyst/Purple
  primaryLight: '#F3E8FF',        // Soft violet backdrop
  primaryDark: '#5E21B6',         // Deep Royal Amethyst
  accent: '#FF6037',              // Orange-coral (mockup theme primary!)
  accentLight: '#FFEBE6',         // Light Orange-coral backdrop
  income: '#10B981',              // Success Mint/Emerald
  incomeBg: 'rgba(16, 185, 129, 0.1)',
  expense: '#F43F5E',             // Rose
  expenseBg: 'rgba(244, 63, 94, 0.1)',
  textPrimary: '#0F172A',         // Cool Dark Slate (Slate-900)
  textSecondary: '#475569',       // Secondary Cool Grey (Slate-600)
  textMuted: '#94A3B8',           // Muted Grey (Slate-400)
  border: '#E2E8F0',              // Subtle light borders (Slate-200)
  borderLight: '#F1F5F9',         // Slate-100
  glass: 'rgba(255, 255, 255, 0.8)',
  glassLight: 'rgba(255, 255, 255, 0.95)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F43F5E',
  gradientStart: '#F8F9FC',
  gradientEnd: '#E2E8F0',
  cardGradientStart: 'rgba(138, 63, 252, 0.04)',
  cardGradientEnd: 'rgba(16, 185, 129, 0.02)',
  
  // Custom mockup theme gradients and colors
  mockupBalanceStart: '#1C1E3A',  // Wavy dark card gradient start
  mockupBalanceEnd: '#2D325A',    // Wavy dark card gradient end
  mockupSalaryStart: '#6D3BFF',   // Salary purple gradient start
  mockupSalaryEnd: '#9E7BFF',     // Salary purple gradient end
  mockupExpenseStart: '#FF5F38',  // Expense orange-coral start
  mockupExpenseEnd: '#FF8C68',    // Expense orange-coral end
  mockupOrange: '#FF6037',        // Mockup primary orange
  mockupPurple: '#8A3FFC',        // Mockup secondary purple
  mockupNavy: '#1C1E3A',          // Mockup navy blue
  mockupLightGrey: '#F6F6F9',     // Mockup background grey
};

const DarkTheme = {
  background: '#090A0F',          // Obsidian black base
  surface: '#12131A',             // Obsidian Card Slate
  surfaceLight: '#181A24',        // Elevated surface
  primary: '#8A3FFC',             // Vibrant purple accent
  primaryLight: '#A366FF',        // Light violet backdrop
  primaryDark: '#5E1BDB',         // Deep Royal Purple
  accent: '#FF6037',              // Orange-coral (mockup theme primary!)
  accentLight: '#FFEBE6',
  income: '#00D26A',              // Emerald Mint
  incomeBg: 'rgba(0, 210, 106, 0.12)',
  expense: '#FF4D67',             // Rose red
  expenseBg: 'rgba(255, 77, 103, 0.12)',
  textPrimary: '#FFFFFF',         // White text
  textSecondary: '#8E949A',       // Medium emphasis text
  textMuted: '#54595E',           // Low emphasis text
  border: '#1A1C26',              // Obsidian border
  borderLight: '#1F222F',
  glass: 'rgba(18, 19, 26, 0.7)',
  glassLight: 'rgba(24, 26, 36, 0.85)',
  overlay: 'rgba(0, 0, 0, 0.75)',
  success: '#00D26A',
  warning: '#FFB648',
  error: '#FF4D67',
  gradientStart: '#090A0F',
  gradientEnd: '#12131A',
  cardGradientStart: 'rgba(138, 63, 252, 0.12)',
  cardGradientEnd: 'rgba(0, 210, 106, 0.04)',
  
  // Custom mockup theme gradients and colors (dark-adapted)
  mockupBalanceStart: '#0E101E',
  mockupBalanceEnd: '#1A1C30',
  mockupSalaryStart: '#5E1BDB',
  mockupSalaryEnd: '#8A3FFC',
  mockupExpenseStart: '#FF6037',
  mockupExpenseEnd: '#FF8C68',
  mockupOrange: '#FF6037',
  mockupPurple: '#8A3FFC',
  mockupNavy: '#1A1C29',
  mockupLightGrey: '#12131A',
};

type ThemeColors = typeof LightTheme;

// Create a Proxy that dynamically reads from the active theme state
export const Colors = new Proxy({} as ThemeColors, {
  get(target, prop: keyof ThemeColors) {
    const state = useAppStore.getState() as any;
    const theme = state.theme || 'light';
    const activePalette = theme === 'dark' ? DarkTheme : LightTheme;
    return activePalette[prop];
  }
});
