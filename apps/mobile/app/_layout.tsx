import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-store';
import { useProfile } from '@/lib/profile-store';
import { colors } from '@/lib/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000, refetchOnWindowFocus: false } },
});

export default function RootLayout() {
  const hydrateAuth = useAuth((s) => s.hydrate);
  const hydrateProfile = useProfile((s) => s.hydrate);

  useEffect(() => {
    hydrateAuth();
    hydrateProfile();
  }, [hydrateAuth, hydrateProfile]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.ink,
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: '登录 / 注册', presentation: 'modal' }} />
            <Stack.Screen name="birth-input" options={{ title: '出生信息', presentation: 'modal' }} />
            <Stack.Screen name="bazi" options={{ title: '八字排盘' }} />
            <Stack.Screen name="daily" options={{ title: '每日运势' }} />
            <Stack.Screen name="tarot" options={{ title: '塔罗占卜' }} />
            <Stack.Screen name="ziwei" options={{ title: '紫微斗数' }} />
            <Stack.Screen name="liuyao" options={{ title: '六爻' }} />
            <Stack.Screen name="meihua" options={{ title: '梅花易数' }} />
            <Stack.Screen name="marriage" options={{ title: '八字合婚' }} />
            <Stack.Screen name="music-oracle" options={{ title: '音乐运势签' }} />
            <Stack.Screen name="huangli" options={{ title: '黄历' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
