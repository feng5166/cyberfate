import { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  mockDailyFortune,
  mockWeeklyTips,
  getCurrentSolarTerm,
} from "../../lib/mockData";
import { useAppStore } from "../../stores/useAppStore";

const COLORS = {
  bg: "#FAF6EE",
  bgDeep: "#F2EDE0",
  ink: "#1B2540",
  secondary: "#5A5A5A",
  weak: "#9E9E9E",
  accent: "#E87722",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function getDateLabel(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const solarTerm = getCurrentSolarTerm(now);
  return `${month}月${day}日 · ${solarTerm}`;
}

const NAV_ITEMS = [
  { emoji: "🎴", label: "八字" },
  { emoji: "⭐", label: "紫微" },
  { emoji: "🃏", label: "塔罗" },
  { emoji: "☯️", label: "六爻" },
  { emoji: "🌸", label: "梅花" },
  { emoji: "💑", label: "合婚" },
  { emoji: "📅", label: "黄历" },
  { emoji: "🧭", label: "排盘" },
  { emoji: "⋯", label: "更多" },
];

export default function HomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { checkedInToday, consecutiveDays, checkIn } = useAppStore();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部问候区 */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}，用户</Text>
            <Text style={styles.dateLabel}>{getDateLabel()}</Text>
          </View>
          <Text style={styles.bell}>🔔</Text>
        </View>

        {/* 今日运势卡片 - 淡入动画 */}
        <Animated.View style={[styles.fortuneCard, { opacity: fadeAnim }]}>
          <View style={styles.fortuneCardInner}>
            <View style={styles.fortuneLeft}>
              <Text style={styles.fortuneScore}>{mockDailyFortune.score}</Text>
              <Text style={styles.fortuneLevel}>
                综合运势 · {mockDailyFortune.level}
              </Text>
            </View>
            <View style={styles.fortuneRight}>
              <Text style={styles.fortuneSummary}>
                {mockDailyFortune.summary}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => Alert.alert("敬请期待")}>
            <Text style={styles.fortuneDetailBtn}>查看详情 →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 功能九宫格 */}
        <View style={styles.grid}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.gridItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert("敬请期待")}
            >
              <Text style={styles.gridEmoji}>{item.emoji}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 本周命运速递 */}
        <View>
          <Text style={styles.sectionTitle}>本周命运速递</Text>
          <View style={styles.tipsCard}>
            {mockWeeklyTips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 今日签到 */}
        <View style={styles.checkInWrap}>
          <TouchableOpacity
            style={[styles.checkInBtn, checkedInToday && styles.checkInBtnDone]}
            onPress={checkIn}
            disabled={checkedInToday}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInBtnText}>
              {checkedInToday ? "已签到 ✓" : "✍️ 今日签到"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.checkInStreak}>连续 {consecutiveDays} 天</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 24 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 16,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.ink },
  dateLabel: { fontSize: 13, color: COLORS.weak, marginTop: 4 },
  bell: { fontSize: 22 },
  fortuneCard: {
    backgroundColor: COLORS.bgDeep,
    borderRadius: 16,
    padding: 20,
  },
  fortuneCardInner: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fortuneLeft: { marginRight: 20, alignItems: "center" },
  fortuneScore: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.accent,
    lineHeight: 56,
  },
  fortuneLevel: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  fortuneRight: { flex: 1 },
  fortuneSummary: { fontSize: 15, color: COLORS.ink, lineHeight: 22 },
  fortuneDetailBtn: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: "600",
    textAlign: "right",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "33.33%", alignItems: "center", paddingVertical: 16, gap: 6 },
  gridEmoji: { fontSize: 28 },
  gridLabel: { fontSize: 13, color: COLORS.ink, fontWeight: "500" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 12,
  },
  tipsCard: {
    backgroundColor: COLORS.bgDeep,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.secondary,
    flex: 1,
    lineHeight: 20,
  },
  checkInWrap: { alignItems: "center", gap: 8, paddingBottom: 8 },
  checkInBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkInBtnDone: { backgroundColor: COLORS.weak },
  checkInBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  checkInStreak: { fontSize: 12, color: COLORS.weak },
});
