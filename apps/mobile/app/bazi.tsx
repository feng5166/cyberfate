import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AnimatedBar, Button, Card, ErrorView, Loading, Screen, ScreenSkeleton, SectionTitle } from '@/components/ui';
import { FollowUpChat } from '@/components/FollowUpChat';
import { colors, wuxingColor } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { useProfile } from '@/lib/profile-store';
import { ApiError, askBazi, getBazi, type Pillar } from '@/lib/api';

const PILLAR_LABELS: Array<[keyof BaziPillars, string]> = [
  ['year', '年柱'],
  ['month', '月柱'],
  ['day', '日柱'],
  ['hour', '时柱'],
];
type BaziPillars = { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };

export default function BaziScreen() {
  const router = useRouter();
  const profile = useProfile((s) => s.profile);
  const hydrated = useProfile((s) => s.hydrated);
  const token = useAuth((s) => s.token);

  const q = useQuery({
    queryKey: ['bazi', profile?.gender, profile?.birthDate, profile?.birthHour],
    queryFn: () => getBazi(profile!),
    enabled: !!profile,
  });

  if (!hydrated) return <Loading />;

  if (!profile) {
    return (
      <Screen>
        <Card style={{ gap: 12 }}>
          <Text style={styles.tip}>需要先填写出生信息才能排盘。</Text>
          <Button title="填写出生信息" onPress={() => router.push('/birth-input')} />
        </Card>
      </Screen>
    );
  }

  if (q.isLoading) return <ScreenSkeleton label="正在排盘…" />;
  if (q.error) {
    const msg = q.error instanceof ApiError ? q.error.message : '排盘失败，请重试';
    return (
      <Screen>
        <ErrorView message={msg} onRetry={() => q.refetch()} />
      </Screen>
    );
  }

  const d = q.data!;
  const wuxingEntries = Object.entries(d.wuxing ?? {});
  const maxWuxing = Math.max(1, ...wuxingEntries.map(([, v]) => v));

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <Card>
        <SectionTitle>四柱八字</SectionTitle>
        <View style={styles.pillarRow}>
          {PILLAR_LABELS.map(([key, label]) => {
            const p = d.pillars[key];
            const showHour = key !== 'hour' || d.hasHour;
            return (
              <View key={key} style={styles.pillarCol}>
                <Text style={styles.pillarLabel}>{label}</Text>
                <Text style={styles.gan}>{showHour ? p.gan : '—'}</Text>
                <Text style={styles.zhi}>{showHour ? p.zhi : '—'}</Text>
              </View>
            );
          })}
        </View>
        {!d.hasHour ? <Text style={styles.note}>未填写时辰，时柱不参与计算</Text> : null}
      </Card>

      <Card>
        <SectionTitle>命主概览</SectionTitle>
        <View style={styles.metaRow}>
          <Meta label="生肖" value={d.zodiac} />
          {d.mingGe?.dayMaster ? <Meta label="日主" value={String(d.mingGe.dayMaster)} /> : null}
          {d.mingGe?.strength ? <Meta label="身强弱" value={String(d.mingGe.strength)} /> : null}
        </View>
      </Card>

      <Card>
        <SectionTitle>五行分布</SectionTitle>
        <View style={{ gap: 10, marginTop: 8 }}>
          {wuxingEntries.map(([name, value]) => (
            <View key={name} style={styles.barRow} accessible accessibilityLabel={`${name} ${value}`}>
              <Text style={styles.barLabel}>{name}</Text>
              <AnimatedBar ratio={value / maxWuxing} color={wuxingColor[name] ?? colors.accent} />
              <Text style={styles.barValue}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>

      {token ? (
        <FollowUpChat
          ask={(question) => askBazi(profile, question)}
          title="八字追问"
          placeholder="例如：我今年的事业运怎么样？"
        />
      ) : (
        <Card style={{ gap: 12 }}>
          <Text style={styles.tip}>登录后可就你的排盘结果向 AI 追问命理细节。</Text>
          <Button title="去登录" variant="ghost" onPress={() => router.push('/login')} />
        </Card>
      )}

      <Text style={styles.footer}>排盘依传统命理推演 · 仅供娱乐参考</Text>
    </Screen>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  pillarRow: { flexDirection: 'row', marginTop: 12 },
  pillarCol: { flex: 1, alignItems: 'center', gap: 6 },
  pillarLabel: { fontSize: 12, color: colors.weak },
  gan: { fontSize: 26, fontWeight: '800', color: colors.ink },
  zhi: { fontSize: 26, fontWeight: '800', color: colors.accentDeep },
  note: { fontSize: 12, color: colors.weak, marginTop: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 10 },
  meta: { gap: 2 },
  metaLabel: { fontSize: 12, color: colors.weak },
  metaValue: { fontSize: 16, fontWeight: '700', color: colors.ink },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 20, fontSize: 14, color: colors.ink, fontWeight: '600' },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.bgDeep, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  barValue: { width: 18, textAlign: 'right', fontSize: 13, color: colors.secondary },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
