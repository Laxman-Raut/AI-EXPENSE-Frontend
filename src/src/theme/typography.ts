import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  amountSmall: {
    fontSize: 18,
    fontWeight: '700',
  },
};
