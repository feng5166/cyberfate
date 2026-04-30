import "../global.css";
import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments, useNavigationContainerRef } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

/**
 * Protects routes by redirecting to /onboarding when the user hasn't onboarded.
 * Fix: wait for the navigation container to be fully ready before any router.replace().
 */
function useProtectedRoute() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const segments = useSegments();
  const router = useRouter();
  const navRef = useNavigationContainerRef();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Don't do anything until the navigation tree is mounted and ready
    if (!navRef.current) return;

    // Only navigate once to avoid loops
    if (hasNavigated.current) return;

    const inOnboarding = segments[0] === "onboarding";

    if (!isOnboarded && !inOnboarding) {
      hasNavigated.current = true;
      router.replace("/onboarding");
    } else if (isOnboarded && inOnboarding) {
      hasNavigated.current = true;
      router.replace("/");
    }
  }, [isOnboarded, segments, navRef.current]);
}

export default function RootLayout() {
  useProtectedRoute();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor="#FAF6EE" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
