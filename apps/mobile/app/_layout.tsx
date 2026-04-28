import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "../stores/useAppStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
});

function AppNavigator() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isOnboarded]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FAF6EE" />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
