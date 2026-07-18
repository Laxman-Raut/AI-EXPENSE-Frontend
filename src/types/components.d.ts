declare module '*/components/atoms/PrimaryButton' {
  import React from 'react';
  import { ViewStyle, TextStyle } from 'react-native';
  export interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    type?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
    icon?: React.ReactNode;
    style?: ViewStyle | TextStyle | any;
    textStyle?: TextStyle | any;
  }
  const PrimaryButton: React.FC<PrimaryButtonProps>;
  export default PrimaryButton;
}

declare module '*/components/molecules/Card' {
  import React from 'react';
  import { ViewStyle } from 'react-native';
  export interface CardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle | any;
    variant?: 'solid' | 'outlined' | 'glass';
    activeOpacity?: number;
    [key: string]: any;
  }
  const Card: React.FC<CardProps>;
  export default Card;
}

declare module '*/components/molecules/Header' {
  import React from 'react';
  import { ViewStyle, TextStyle } from 'react-native';
  export interface HeaderProps {
    title: string;
    subtitle?: string;
    leftIcon?: React.ReactNode;
    onLeftPress?: () => void;
    rightIcon?: React.ReactNode;
    onRightPress?: () => void;
    rightActions?: React.ReactNode;
    style?: ViewStyle | any;
    titleStyle?: TextStyle | any;
  }
  const Header: React.FC<HeaderProps>;
  export default Header;
}

declare module '*/components/templates/Screen' {
  import React from 'react';
  import { ViewStyle } from 'react-native';
  export interface ScreenProps {
    children: React.ReactNode;
    scrollable?: boolean;
    header?: React.ReactNode;
    loading?: boolean;
    edges?: string[];
    style?: ViewStyle | any;
    safeAreaStyle?: ViewStyle | any;
    keyboardAvoiding?: boolean;
    refreshControl?: React.ReactNode;
  }
  const Screen: React.FC<ScreenProps>;
  export default Screen;
}

declare module '*/theme' {
  export const colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    background: string;
    card: string;
    surface: string;
    success: string;
    danger: string;
    warning: string;
    info: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
      inverse: string;
    };
    border: string;
    divider: string;
    overlay: string;
    glass: string;
    accent: string;
    income: string;
    expense: string;
    purple: string;
    navy: string;
  };
  export const spacing: {
    none: number;
    xxs: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  export const radius: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  export const shadow: {
    none: any;
    xs: any;
    sm: any;
    md: any;
    lg: any;
  };
  export const typography: {
    sizes: {
      xs: number;
      sm: number;
      base: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      h1: number;
      h2: number;
      h3: number;
      h4: number;
      display: number;
    };
    weights: {
      thin: '100';
      light: '300';
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
      heavy: '900';
    };
    lineHeights: {
      xs: number;
      sm: number;
      base: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      h1: number;
      h2: number;
    };
  };
}
