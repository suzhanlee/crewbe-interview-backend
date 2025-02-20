import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  MockInterview: undefined;
  Schedule: undefined;
  Profile: undefined;
};

export type MockInterviewScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MockInterview'
>; 