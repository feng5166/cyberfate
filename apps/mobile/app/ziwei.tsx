import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, ErrorView, Loading, Screen, ScreenSkeleton, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { useProfile } from '@/lib/profile-store';
import { NeedLogin, NeedProfile } from '@/components/gates';
import { ApiError, getZiwei, type ZiweiPalace } from '@/lib/api';

function starNames(palace: ZiweiPalace): string {
  const stars = palace.stars ?? [];
  return stars
    .map((s) => (typeof s === 'string' ? s : s?.name))
    .filter(Boolean)
    .join(' ');
}

export default function ZiweiScreen() {
  const token = useAuth((s) => s.token);
  const authHydrated = useAuth((s) => s.hydrated);
  const profile = useProfile((s) => s.profile);
  const profileHydrated = useProfile((s) => s.hydrated);

  const q = useQuery({
    queryKey: ['ziwei', profile?.gender, profile?.birthDate, profile?.birthHour],
    queryFn: () => getZiwei(profile!),
    enabled: !!token && !!profile,
  });

  if (!authHydrated || !profileHydrated) return <Loading />;
  if (!token) return <NeedLogin feature="紫微斗数" />;
  if (!profile) return <NeedProfile />;

  if (q.isLoading) return <ScreenSkeleton label="正在排紫微命盘…" />;
  if (q.error) {
    const msg = q.error instanceof ApiError ? q.error.message : '排盘失败，请重试';
    return (
      <Screen>
        <ErrorView message={msg} onRetry={() => q.refetch()} />
      </Screen>
    );
  }

  const d = q.data!;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <Card>
        <SectionTitle>命盘概览</SectionTitle>
        <View style={styles.metaRow}>
          <Meta label="五行局" value={d.wuxingju} />
          <Meta label="命主" value={d.mingzhu} />
          <Meta label="身主" value={d.shenzhu} />
        </View>
        <View style={[styles.metaRow, { marginTop: 10 }]}>
          {d.mingGong?.name ? <Meta label="命宫" value={`${d.mingGong.name}`} /> : null}
          {d.shenGong?.name ? <Meta label="身宫" value={`${d.shenGong.name}`} /> : null}
          {d.lunar?.lunarDate ? <Meta label="农历" value={d.lunar.lunarDate} /> : null}
        </View>
      </Card>

      <Card>
        <SectionTitle>十二宫</SectionTitle>
        <View style={{ gap: 10, marginTop: 8 }}>
          {(d.palaces ?? []).map((p, i) => (
            <View key={i} style={styles.palaceRow}>
              <Text style={styles.palaceName}>
                {p.name ?? '—'}
                {p.branch ? ` · ${p.branch}` : ''}
              </Text>
              <Text style={styles.palaceStars}>{starNames(p) || '—'}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.footer}>排盘由服务端确定性算法生成 · 仅供娱乐参考</Text>
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
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginTop: 10 },
  meta: { gap: 2 },
  metaLabel: { fontSize: 12, color: colors.weak },
  metaValue: { fontSize: 16, fontWeight: '700', color: colors.ink },
  palaceRow: { gap: 2, borderBottomWidth: 1, borderBottomColor: colors.bgDeep, paddingBottom: 8 },
  palaceName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  palaceStars: { fontSize: 13, color: colors.secondary, lineHeight: 19 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
