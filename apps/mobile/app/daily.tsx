import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button, Card, ErrorView, Loading, Screen, ScreenSkeleton, SectionTitle } from '@/components/ui';
import { FollowUpChat } from '@/components/FollowUpChat';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { useProfile } from '@/lib/profile-store';
import { ApiError, askDaily, getDaily } from '@/lib/api';

const RATING_LABELS: Array<[keyof DailyRatings, string]> = [
  ['career', '事业'],
  ['wealth', '财运'],
  ['love', '感情'],
  ['health', '健康'],
  ['studies', '学业'],
  ['social', '人际'],
];
type DailyRatings = {
  career: number;
  wealth: number;
  love: number;
  health: number;
  studies: number;
  social: number;
};

export default function DailyScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const authHydrated = useAuth((s) => s.hydrated);
  const profile = useProfile((s) => s.profile);
  const profileHydrated = useProfile((s) => s.hydrated);

  const q = useQuery({
    queryKey: ['daily', profile?.gender, profile?.birthDate, profile?.birthHour],
    queryFn: () => getDaily(profile!),
    enabled: !!token && !!profile,
  });

  if (!authHydrated || !profileHydrated) return <Loading />;

  if (!token) {
    return (
      <Screen>
        <Card style={{ gap: 12 }}>
          <Text style={styles.tip}>每日运势包含 AI 解读，需登录后使用。</Text>
          <Button title="去登录" onPress={() => router.push('/login')} />
        </Card>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Card style={{ gap: 12 }}>
          <Text style={styles.tip}>请先填写出生信息。</Text>
          <Button title="填写出生信息" onPress={() => router.push('/birth-input')} />
        </Card>
      </Screen>
    );
  }

  if (q.isLoading) return <ScreenSkeleton label="AI 正在为你测算今日运势…" />;
  if (q.error) {
    const err = q.error;
    const msg = err instanceof ApiError ? err.message : '获取失败，请重试';
    const isQuota = err instanceof ApiError && err.status === 403;
    return (
      <Screen>
        <ErrorView message={isQuota ? `${msg}（每日免费额度有限）` : msg} onRetry={() => q.refetch()} />
      </Screen>
    );
  }

  const d = q.data!;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <Card style={styles.overallCard}>
        <Text style={styles.date}>
          {d.date} · {d.lunarDate} · {d.dayGanzhi}日
        </Text>
        <View style={styles.overallRow}>
          <Text style={styles.score}>{d.overall}</Text>
          <View>
            <Text style={styles.scoreLabel}>综合运势</Text>
            <Text style={styles.level}>{d.overallLabel}</Text>
          </View>
        </View>
        {d.headline ? <Text style={styles.headline}>{d.headline}</Text> : null}
      </Card>

      <Card>
        <SectionTitle>六维运势</SectionTitle>
        <View style={{ gap: 10, marginTop: 10 }}>
          {RATING_LABELS.map(([key, label]) => {
            const v = d.ratings[key] ?? 0;
            return (
              <View key={key} style={styles.barRow} accessible accessibilityLabel={`${label} ${v} 分，满分 5 分`}>
                <Text style={styles.barLabel}>{label}</Text>
                <View style={styles.barTrack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <View style={[styles.barFill, { width: `${(v / 5) * 100}%` }]} />
                </View>
                <Text style={styles.barValue}>{v}/5</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.split}>
        <Card style={{ flex: 1 }}>
          <Text style={styles.suitTitle}>宜</Text>
          {(d.suitable ?? []).map((s, i) => (
            <Text key={i} style={styles.suitItem}>
              · {s}
            </Text>
          ))}
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={[styles.suitTitle, { color: colors.danger }]}>忌</Text>
          {(d.avoid ?? []).map((s, i) => (
            <Text key={i} style={styles.suitItem}>
              · {s}
            </Text>
          ))}
        </Card>
      </View>

      {d.advice ? (
        <Card>
          <SectionTitle>今日建议</SectionTitle>
          <Text style={styles.advice}>{d.advice}</Text>
          {d.luckyHour ? <Text style={styles.lucky}>吉时：{d.luckyHour}</Text> : null}
        </Card>
      ) : null}

      <FollowUpChat ask={askDaily} title="运势追问" placeholder="例如：今天适合谈合作吗？" />

      <Text style={styles.footer}>解读由 AI 生成 · 仅供娱乐参考</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  overallCard: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  date: { fontSize: 13, color: colors.secondary },
  overallRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  score: { fontSize: 48, fontWeight: '800', color: colors.accentDeep },
  scoreLabel: { fontSize: 13, color: colors.secondary },
  level: { fontSize: 20, fontWeight: '700', color: colors.ink },
  headline: { fontSize: 14, color: colors.ink, marginTop: 10, lineHeight: 21 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 30, fontSize: 14, color: colors.ink, fontWeight: '600' },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.bgDeep, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.accent },
  barValue: { width: 30, textAlign: 'right', fontSize: 12, color: colors.secondary },
  split: { flexDirection: 'row', gap: 12 },
  suitTitle: { fontSize: 16, fontWeight: '800', color: colors.accentDeep, marginBottom: 8 },
  suitItem: { fontSize: 14, color: colors.secondary, lineHeight: 22 },
  advice: { fontSize: 15, color: colors.ink, lineHeight: 23, marginTop: 6 },
  lucky: { fontSize: 13, color: colors.accentDeep, marginTop: 10, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
