import { Redirect } from "expo-router";
import { useAppStore } from "../stores/useAppStore";

export default function Index() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const baziResult = useAppStore((s) => s.baziResult);

  if (!isOnboarded) return <Redirect href="/onboarding" />;
  if (!baziResult) return <Redirect href="/birth-input" />;
  return <Redirect href="/(tabs)" />;
}
