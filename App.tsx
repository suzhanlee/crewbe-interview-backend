import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './src/screens/Home';
import MockInterviewScreen from './src/screens/MockInterview';
import ScheduleScreen from './src/screens/Schedule';
import ProfileScreen from './src/screens/Profile';
import { COLORS } from './src/utils/constants';
import { RootStackParamList } from './src/types/navigation';
import { ScheduleProvider } from './src/contexts/ScheduleContext';

const Tab = createBottomTabNavigator<RootStackParamList>();

export default function App() {
  return (
    <ScheduleProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              switch (route.name) {
                case 'Home':
                  iconName = focused ? 'home' : 'home-outline';
                  break;
                case 'MockInterview':
                  iconName = focused ? 'people' : 'people-outline';
                  break;
                case 'Schedule':
                  iconName = focused ? 'calendar' : 'calendar-outline';
                  break;
                case 'Profile':
                  iconName = focused ? 'person' : 'person-outline';
                  break;
                default:
                  iconName = 'home-outline';
              }
              return <Ionicons name={iconName as any} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.gray,
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: '홈' }}
          />
          <Tab.Screen 
            name="MockInterview" 
            component={MockInterviewScreen}
            options={{ title: '모의면접' }}
          />
          <Tab.Screen 
            name="Schedule" 
            component={ScheduleScreen}
            options={{ title: '일정관리' }}
          />
          <Tab.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: '프로필' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </ScheduleProvider>
  );
} 