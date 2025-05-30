const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// AWS SDK 웹 호환성 문제 해결
config.resolver.alias = {
  ...config.resolver.alias,
  'aws-sdk': false, // 웹에서 aws-sdk 사용 방지
};

// 추가 확장자 지원
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'wasm',
];

// 플랫폼별 확장자 우선순위
config.resolver.platforms = [
  'native',
  'android',
  'ios',
  'web',
];

module.exports = config; 