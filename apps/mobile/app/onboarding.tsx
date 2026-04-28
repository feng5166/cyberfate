import { useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAppStore } from "../stores/useAppStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  bg: "#FAF6EE",
  ink: "#1B2540",
  secondary: "#5A5A5A",
  accent: "#E87722",
  weak: "#9E9E9E",
};

const PAGES = [
  {
    image: require("../assets/onboarding/onboarding-1-dawn-mountain.png"),
    text: "每日运势，推送不错过",
  },
  {
    image: require("../assets/onboarding/onboarding-2-star-chart.png"),
    text: "AI 命理，传统 × 现代",
  },
  {
    image: require("../assets/onboarding/onboarding-3-fate-cards.png"),
    text: "我的命运，可分享可沉淀",
  },
];

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPage(page);
  }

  function handleStart() {
    setOnboarded(true);
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {PAGES.map((page, i) => (
          <View key={i} style={styles.page}>
            <Image
              source={page.image}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.pageText}>{page.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 分页指示器 */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentPage && styles.dotActive]}
          />
        ))}
      </View>

      {/* 按钮区 */}
      {currentPage === PAGES.length - 1 ? (
        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.8}
          onPress={handleStart}
        >
          <Text style={styles.startBtnText}>开始体验</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.skipBtn}
          activeOpacity={0.7}
          onPress={handleStart}
        >
          <Text style={styles.skipBtnText}>跳过</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
  },
  pager: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  pagerContent: {},
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 32,
  },
  image: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
  },
  pageText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.ink,
    textAlign: "center",
    lineHeight: 32,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0D8C8",
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 24,
    borderRadius: 4,
  },
  startBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 64,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 32,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  skipBtn: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 32,
  },
  skipBtnText: {
    fontSize: 16,
    color: COLORS.weak,
  },
});
