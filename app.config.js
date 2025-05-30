import 'dotenv/config';

export default {
  expo: {
    name: "승무원 준비생 앱",
    slug: "flight-attendant-app",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "DETECT_SCREEN_CAPTURE"
      ],
      adaptiveIcon: {
        backgroundColor: "#ffffff"
      },
      package: "com.suzhanlee.flightattendantapp"
    },
    platforms: [
      "ios",
      "android",
      "web"
    ],
    plugins: [
      "expo-camera",
      [
        "expo-image-picker",
        {
          photosPermission: "앱이 사진에 접근하는 것을 허용하시겠습니까?",
          cameraPermission: "앱이 카메라에 접근하는 것을 허용하시겠습니까?"
        }
      ]
    ],
    extra: {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
      AWS_REGION: process.env.AWS_REGION || "ap-northeast-2",
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || "",
      AWS_S3_RECORDING_BUCKET: process.env.AWS_S3_RECORDING_BUCKET || ""
    }
  }
}; 