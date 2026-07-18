import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from './colors';

// 1. Define the palettes for the themes (Dark is default, Light is white mode)
export const THEMES = {
  'Dark': {
    primary: '#8A3FFC',
    primaryLight: '#A366FF',
    primaryDark: '#5E1BDB',
    secondary: '#1A1C29',
    background: '#090A0F',
    card: '#12131A',
    surface: '#181A24',
    success: '#00D26A',
    danger: '#FF4D67',
    warning: '#FFB648',
    info: '#4B8CFF',
    border: '#1A1C26',
    divider: '#1F222F',
    text: {
      primary: '#FFFFFF',
      secondary: '#8E949A',
      muted: '#54595E',
      inverse: '#090A0F',
    },
    overlay: 'rgba(0, 0, 0, 0.75)',
    glass: 'rgba(18, 19, 26, 0.8)',
    accent: '#FF6037',
    income: '#00D26A',
    expense: '#FF4D67',
    purple: '#8A3FFC',
    navy: '#1A1C29',
  },
  'Light': {
    primary: '#8A3FFC',
    primaryLight: '#A366FF',
    primaryDark: '#5E1BDB',
    secondary: '#F2F4F7',
    background: '#F8F9FA',
    card: '#FFFFFF',
    surface: '#F1F3F5',
    success: '#00C853',
    danger: '#D50000',
    warning: '#FFAB00',
    info: '#2979FF',
    border: '#E9ECEF',
    divider: '#E9ECEF',
    text: {
      primary: '#1C1E21',
      secondary: '#5C6370',
      muted: '#8E9AA8',
      inverse: '#FFFFFF',
    },
    overlay: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(255, 255, 255, 0.8)',
    accent: '#FF6037',
    income: '#00C853',
    expense: '#D50000',
    purple: '#8A3FFC',
    navy: '#F2F4F7',
  }
};

const registeredSheets = [];
const listeners = new Set();
let activeThemeName = 'Dark';

// Flatten colors mapping for lookup
function getFlatColorMap(themeObj) {
  const map = {};
  function traverse(obj, path = '') {
    for (const key in obj) {
      const val = obj[key];
      const newPath = path ? `${path}.${key}` : key;
      if (typeof val === 'string') {
        map[val.toLowerCase()] = newPath;
      } else if (typeof val === 'object' && val !== null) {
        traverse(val, newPath);
      }
    }
  }
  traverse(themeObj);
  return map;
}

const baseMap = getFlatColorMap(THEMES['Dark']);

function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Override StyleSheet.create
const originalCreate = StyleSheet.create;

StyleSheet.create = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return originalCreate(obj);
  }

  // Create mutable deep copy
  const sheetCopy = {};
  for (const styleKey in obj) {
    if (obj[styleKey]) {
      sheetCopy[styleKey] = { ...obj[styleKey] };
    }
  }

  // If light theme is active during load, pre-apply
  if (activeThemeName !== 'Dark') {
    const targetTheme = THEMES[activeThemeName];
    for (const styleKey in obj) {
      const originalRule = obj[styleKey];
      const currentRule = sheetCopy[styleKey];
      if (originalRule && currentRule) {
        for (const ruleKey in originalRule) {
          const val = originalRule[ruleKey];
          if (typeof val === 'string') {
            const valLower = val.toLowerCase();
            if (baseMap[valLower]) {
              const keyPath = baseMap[valLower];
              const newVal = getValueByPath(targetTheme, keyPath);
              if (newVal) {
                currentRule[ruleKey] = newVal;
              }
            }
          }
        }
      }
    }
  }

  registeredSheets.push({ original: obj, current: sheetCopy });
  
  // Return Proxy so properties can be dynamically read without being frozen by originalCreate
  return new Proxy(sheetCopy, {
    get(target, prop) {
      return target[prop];
    }
  });
};

function updateStaticColors(staticObj, targetObj) {
  for (const key in targetObj) {
    if (typeof targetObj[key] === 'object' && targetObj[key] !== null) {
      if (!staticObj[key]) staticObj[key] = {};
      updateStaticColors(staticObj[key], targetObj[key]);
    } else {
      staticObj[key] = targetObj[key];
    }
  }
}

export function applyTheme(themeName) {
  if (!THEMES[themeName]) return;
  activeThemeName = themeName;
  const targetTheme = THEMES[themeName];

  // Update static colors in-place
  updateStaticColors(colors, targetTheme);

  // Update sheets in-place
  registeredSheets.forEach(({ original, current }) => {
    for (const styleKey in original) {
      const originalRule = original[styleKey];
      const currentRule = current[styleKey];
      if (originalRule && currentRule) {
        for (const ruleKey in originalRule) {
          const val = originalRule[ruleKey];
          if (typeof val === 'string') {
            const valLower = val.toLowerCase();
            if (baseMap[valLower]) {
              const keyPath = baseMap[valLower];
              const newVal = getValueByPath(targetTheme, keyPath);
              if (newVal) {
                currentRule[ruleKey] = newVal;
              }
            }
          }
        }
      }
    }
  });

  // Notify listeners on next tick
  setTimeout(() => {
    listeners.forEach(l => l(themeName));
  }, 0);
}

export function registerThemeListener(l) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getActiveThemeName() {
  return activeThemeName;
}

export async function initializeTheme() {
  try {
    const savedTheme = await AsyncStorage.getItem('user_theme');
    if (savedTheme && THEMES[savedTheme]) {
      applyTheme(savedTheme);
    } else {
      applyTheme('Dark'); // Default to dark theme!
    }
  } catch (err) {
    console.error('Failed to load user theme setting:', err);
  }
}
