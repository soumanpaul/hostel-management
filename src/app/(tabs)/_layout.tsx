import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { AppLoading } from '@/components/app-loading';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/tokens';

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, TabIconName> = {
  index: 'grid-outline',
  students: 'people-outline',
  rooms: 'bed-outline',
  billing: 'receipt-outline',
  more: 'ellipsis-horizontal',
};

export default function TabsLayout() {
  const isAppReady = useAppStore((state) => state.isReady);
  const isAuthHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);

  if (!isAppReady || !isAuthHydrated) {
    return <AppLoading />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: '#7b8494',
        tabBarStyle: {
          minHeight: 64,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: '#e6ebf3',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name] ?? 'ellipse-outline'} color={color} size={size} />
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="students" options={{ title: 'Students' }} />
      <Tabs.Screen name="rooms" options={{ title: 'Rooms' }} />
      <Tabs.Screen name="billing" options={{ title: 'Billing' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
