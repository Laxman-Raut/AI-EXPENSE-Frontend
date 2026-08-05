import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const BANK_BRAND_MAP = {
  sbi: {
    name: 'State Bank of India',
    code: 'SBI',
    bg: '#002A54',
    color: '#00A3E0',
    logo: 'https://logo.clearbit.com/sbi.co.in',
  },
  hdfc: {
    name: 'HDFC Bank',
    code: 'HDFC',
    bg: '#004B8D',
    color: '#ED232A',
    logo: 'https://logo.clearbit.com/hdfcbank.com',
  },
  icici: {
    name: 'ICICI Bank',
    code: 'ICICI',
    bg: '#052F5F',
    color: '#F37021',
    logo: 'https://logo.clearbit.com/icicibank.com',
  },
  axis: {
    name: 'Axis Bank',
    code: 'AXIS',
    bg: '#97144D',
    color: '#FFFFFF',
    logo: 'https://logo.clearbit.com/axisbank.com',
  },
  kotak: {
    name: 'Kotak Mahindra Bank',
    code: 'KOTAK',
    bg: '#ED1C24',
    color: '#FFFFFF',
    logo: 'https://logo.clearbit.com/kotak.com',
  },
  pnb: {
    name: 'Punjab National Bank',
    code: 'PNB',
    bg: '#A20A3B',
    color: '#FFD100',
    logo: 'https://logo.clearbit.com/pnbindia.in',
  },
  bob: {
    name: 'Bank of Baroda',
    code: 'BOB',
    bg: '#F26522',
    color: '#FFFFFF',
    logo: 'https://logo.clearbit.com/bankofbaroda.in',
  },
  canara: {
    name: 'Canara Bank',
    code: 'CANARA',
    bg: '#0091DA',
    color: '#FFD100',
    logo: 'https://logo.clearbit.com/canarabank.com',
  },
  yes: {
    name: 'Yes Bank',
    code: 'YES',
    bg: '#005B94',
    color: '#E31B23',
    logo: 'https://logo.clearbit.com/yesbank.in',
  },
  union: {
    name: 'Union Bank',
    code: 'UBI',
    bg: '#003366',
    color: '#E31E24',
    logo: 'https://logo.clearbit.com/unionbankofindia.co.in',
  },
  indusind: {
    name: 'IndusInd Bank',
    code: 'INDUS',
    bg: '#85171A',
    color: '#FFFFFF',
    logo: 'https://logo.clearbit.com/indusind.com',
  },
  idfc: {
    name: 'IDFC FIRST Bank',
    code: 'IDFC',
    bg: '#9C1D26',
    color: '#FFD100',
    logo: 'https://logo.clearbit.com/idfcfirstbank.com',
  },
  paytm: {
    name: 'Paytm Bank',
    code: 'PAYTM',
    bg: '#002E6D',
    color: '#00BAF2',
    logo: 'https://logo.clearbit.com/paytmbank.com',
  },
  federal: {
    name: 'Federal Bank',
    code: 'FED',
    bg: '#004A97',
    color: '#FFC72C',
    logo: 'https://logo.clearbit.com/federalbank.co.in',
  },
};

const resolveBankBrand = (bankNameStr = '') => {
  const str = String(bankNameStr).toLowerCase();
  if (str.includes('sbi') || str.includes('state bank')) return BANK_BRAND_MAP.sbi;
  if (str.includes('hdfc')) return BANK_BRAND_MAP.hdfc;
  if (str.includes('icici')) return BANK_BRAND_MAP.icici;
  if (str.includes('axis')) return BANK_BRAND_MAP.axis;
  if (str.includes('kotak')) return BANK_BRAND_MAP.kotak;
  if (str.includes('pnb') || str.includes('punjab national')) return BANK_BRAND_MAP.pnb;
  if (str.includes('baroda') || str.includes('bob')) return BANK_BRAND_MAP.bob;
  if (str.includes('canara')) return BANK_BRAND_MAP.canara;
  if (str.includes('yes bank')) return BANK_BRAND_MAP.yes;
  if (str.includes('union bank')) return BANK_BRAND_MAP.union;
  if (str.includes('indusind')) return BANK_BRAND_MAP.indusind;
  if (str.includes('idfc')) return BANK_BRAND_MAP.idfc;
  if (str.includes('paytm')) return BANK_BRAND_MAP.paytm;
  if (str.includes('federal')) return BANK_BRAND_MAP.federal;

  // Fallback brand for unknown banks
  const words = bankNameStr.trim().split(' ');
  const code = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : bankNameStr.substring(0, 3).toUpperCase();
  return {
    name: bankNameStr,
    code: code || 'BANK',
    bg: '#4ECDC4',
    color: '#FFFFFF',
    logo: null,
  };
};

const BankLogo = ({ bankName, size = 32, style }) => {
  const [imageError, setImageError] = useState(false);
  const brand = resolveBankBrand(bankName);

  const borderRadius = size / 2;

  if (brand.logo && !imageError) {
    return (
      <View style={[styles.logoContainer, { width: size, height: size, borderRadius }, style]}>
        <Image
          source={{ uri: brand.logo }}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }

  // Styled Brand Badge (Fallback/Default Logo)
  return (
    <View
      style={[
        styles.badgeContainer,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: brand.bg,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: size <= 28 ? 9 : size <= 36 ? 11 : 13,
            color: brand.color,
          },
        ]}
        numberOfLines={1}
      >
        {brand.code}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeText: {
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default BankLogo;
