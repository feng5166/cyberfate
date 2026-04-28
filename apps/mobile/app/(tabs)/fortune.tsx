import { useState, useEffect, useRef, useMemo } from "react";
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
import { mockDailyFortune } from "../../lib/mockData";
import { useAppStore } from "../../stores/useAppStore";

const COLORS = {
  bg: "#FAF6EE",
  bgDeep: "#F2EDE0",
  ink: "#1B2540",
  secondary: "#5A5A5A",
  weak: "#9E9E9E",
  accent: "#E87722",
  earth: "#C9A86C",
  water: "#4A6FA5",
};

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function buildDateRange(center: Date): Date[] {
  const base = new Date(center);
  base.setHours(0, 0, 0, 0);
  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getBarColor(score: number): string {
  if (score >= 8) return COLORS.accent;
  if (score >= 6) return COLORS.earth;
  return COLORS.water;
}

function AnimatedBar({ score, color }: { score: number; color: string }) {
  const [maxWidth, setMaxWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    if (maxWidth > 0) {
      Animated.timing(anim, {
        toValue: (score / 10) * maxWidth,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [score, maxWidth]);

  return (
    <View
      style={styles.dimBarBg}
      onLayout={(e) => setMaxWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[styles.dimBarFill, { width: anim, backgroundColor: color }]}
      />
    </View>
  );
}

export default function FortuneScreen() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [displayScore, setDisplayScore] = useState(0);
  const { checkedInToday, consecutiveDays, checkIn } = useAppStore();

  const fortune = mockDailyFortune;
  const dateRange = useMemo(() => buildDateRange(selectedDate), [selectedDate]);

  useEffect(() => {
    const target = fortune.score;
    const steps = 60;
    const stepTime = 1000 / steps;
    const stepValue = target / steps;
    let current = 0;
    setDisplayScore(0);
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        setDisplayScore(target);
        clearInterval(timer);
      } else {
        setDisplayScore(parseFloat(current.toFixed(1)));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [selectedDate]);

  function prevDay() {
    setSelectedDate((d) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() - 1);
      return nd;
    });
  }

  function nextDay() {
    setSelectedDate((d) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + 1);
      return nd;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 日期切换 */}
        <View style={styles.dateNav}>
          <TouchableOpacity onPress={prevDay} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datePicker}
          >
            {dateRange.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, today);
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.dateItem}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dateWeekday,
                      isSelected && styles.dateWeekdaySelected,
                    ]}
                  >
                    周{WEEKDAYS[date.getDay()]}
                  </Text>
                  <View
                    style={[
                      styles.dateDayCircle,
                      isSelected && styles.dateDayCircleSelected,
                      isToday && !isSelected && styles.dateDayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateDayText,
                        isSelected && styles.dateDayTextSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity onPress={nextDay} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 综合运势大圆 */}
        <View style={styles.scoreCircleWrap}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{displayScore}</Text>
            <Text style={styles.scoreLabel}>综合运势 · {fortune.level}</Text>
          </View>
        </View>

        {/* 五维运势条 */}
        <View style={styles.card}>
          {fortune.dimensions.map((dim) => (
            <View key={dim.name} style={styles.dimRow}>
              <Text style={styles.dimName}>{dim.name}</Text>
              <AnimatedBar score={dim.score} color={getBarColor(dim.score)} />
              <Text style={styles.dimScore}>{dim.score}</Text>
            </View>
          ))}
        </View>

        {/* 宜忌标签 */}
        <View style={styles.card}>
          <View style={styles.tagSection}>
            <Text style={styles.tagSectionTitle}>宜</Text>
            <View style={styles.tagRow}>
              {fortune.suitable.map((t) => (
                <View key={t} style={[styles.tag, styles.tagGood]}>
                  <Text style={styles.tagTextGood}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.tagSection, { marginTop: 12 }]}>
            <Text style={styles.tagSectionTitle}>忌</Text>
            <View style={styles.tagRow}>
              {fortune.avoid.map((t) => (
                <View key={t} style={[styles.tag, styles.tagBad]}>
                  <Text style={styles.tagTextBad}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 吉时与方位 */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={styles.infoText}>{fortune.luckyTime}（财位）</Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{fortune.luckyDirection}</Text>
          </View>
        </View>

        {/* AI 今日建议 */}
        <View style={[styles.card, styles.adviceCard]}>
          <Text style={styles.adviceTitle}>AI 今日建议</Text>
          {fortune.aiAdvice.map((advice, i) => (
            <Text key={i} style={styles.adviceText}>
              {advice}
            </Text>
          ))}
        </View>

        {/* 签到按钮 */}
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

        {/* 分享运势 */}
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => Alert.alert("分享功能开发中")}
        >
          <Text style={styles.shareBtnText}>分享运势 📤</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 20 },

  dateNav: { flexDirection: "row", alignItems: "center" },
  dateArrow: { paddingHorizontal: 4, paddingVertical: 8 },
  dateArrowText: { fontSize: 28, color: COLORS.accent, lineHeight: 32 },
  datePicker: { paddingVertical: 8, gap: 4 },
  dateItem: { alignItems: "center", paddingHorizontal: 10, gap: 6 },
  dateWeekday: { fontSize: 11, color: COLORS.weak },
  dateWeekdaySelected: { color: COLORS.accent, fontWeight: "600" },
  dateDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDayCircleSelected: { backgroundColor: COLORS.accent },
  dateDayCircleToday: { borderWidth: 1.5, borderColor: COLORS.accent },
  dateDayText: { fontSize: 15, color: COLORS.ink, fontWeight: "500" },
  dateDayTextSelected: { color: "#fff", fontWeight: "700" },

  scoreCircleWrap: { alignItems: "center", paddingVertical: 8 },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgDeep,
  },
  scoreNumber: {
    fontSize: 44,
    fontWeight: "800",
    color: COLORS.accent,
    lineHeight: 52,
  },
  scoreLabel: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },

  card: { backgroundColor: COLORS.bgDeep, borderRadius: 16, padding: 16 },

  dimRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  dimName: { width: 36, fontSize: 13, color: COLORS.ink, fontWeight: "500" },
  dimBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#E8E0D0",
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  dimBarFill: { height: "100%", borderRadius: 4 },
  dimScore: { width: 32, fontSize: 13, color: COLORS.secondary, textAlign: "right" },

  tagSection: {},
  tagSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 8,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  tagGood: { backgroundColor: "#E8F5E1" },
  tagBad: { backgroundColor: "#FDE8E8" },
  tagTextGood: { fontSize: 13, color: "#3A6B2A" },
  tagTextBad: { fontSize: 13, color: "#9B2020" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 14, color: COLORS.ink },

  adviceCard: { gap: 10 },
  adviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 2,
  },
  adviceText: { fontSize: 14, color: COLORS.secondary, lineHeight: 22 },

  checkInWrap: { alignItems: "center", gap: 8 },
  checkInBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkInBtnDone: { backgroundColor: COLORS.weak },
  checkInBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  checkInStreak: { fontSize: 12, color: COLORS.weak },

  shareBtn: { alignItems: "center", paddingVertical: 8 },
  shareBtnText: { fontSize: 15, color: COLORS.accent, fontWeight: "600" },
});
