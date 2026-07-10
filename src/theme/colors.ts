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
  background: '#0B0F19',          // Deep Navy Obsidian Slate
  surface: '#151E2E',             // Slate-800 Card Base
  surfaceLight: '#1E293B',        // Slate-700 Elevated Surface
  primary: '#6366F1',             // Indigo accent
  primaryLight: '#1E1B4B',        // Indigo-950 backdrop
  primaryDark: '#4338CA',         // Indigo-700
  accent: '#FF6037',              // Orange-coral (mockup theme primary!)
  accentLight: '#FFEBE6',
  income: '#10B981',              // Emerald
  incomeBg: 'rgba(16, 185, 129, 0.12)',
  expense: '#F43F5E',             // Rose
  expenseBg: 'rgba(244, 63, 94, 0.12)',
  textPrimary: '#F8FAFC',         // Off-white
  textSecondary: '#94A3B8',       // Slate-400
  textMuted: '#64748B',           // Slate-500
  border: 'rgba(99, 102, 241, 0.15)', // Indigo border tint
  borderLight: 'rgba(255, 255, 255, 0.08)',
  glass: 'rgba(21, 30, 46, 0.7)',
  glassLight: 'rgba(30, 41, 59, 0.85)',
  overlay: 'rgba(15, 23, 42, 0.85)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F43F5E',
  gradientStart: '#0B0F19',
  gradientEnd: '#1E1B4B',
  cardGradientStart: 'rgba(99, 102, 241, 0.12)',
  cardGradientEnd: 'rgba(16, 185, 129, 0.04)',
  
  // Custom mockup theme gradients and colors (dark-adapted)
  mockupBalanceStart: '#111326',
  mockupBalanceEnd: '#1C1F38',
  mockupSalaryStart: '#4C27C2',
  mockupSalaryEnd: '#7A54DE',
  mockupExpenseStart: '#D84620',
  mockupExpenseEnd: '#E66F4E',
  mockupOrange: '#FF6037',
  mockupPurple: '#8A3FFC',
  mockupNavy: '#1C1E3A',
  mockupLightGrey: '#151E2E',
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
