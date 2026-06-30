import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, ErrorView, Screen, ScreenSkeleton, SectionTitle } from '@/components/ui';
import { FollowUpChat } from '@/components/FollowUpChat';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { ApiError, askHuangli, getHuangli } from '@/lib/api';

export default function HuangliScreen() {
  const token = useAuth((s) => s.token);
  const q = useQuery({ queryKey: ['huangli', 'today'], queryFn: () => getHuangli() });

  if (q.isLoading) return <ScreenSkeleton label="正在排黄历…" />;
  if (q.error) {
    const msg = q.error instanceof ApiError ? q.error.message : '加载失败';
    return (
      <Screen>
        <ErrorView message={msg} onRetry={() => q.refetch()} />
      </Screen>
    );
  }

  const d = q.data!;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => q.refetch()}>
      <Card style={styles.head}>
        <Text style={styles.solar}>{d.solar}</Text>
        <Text style={styles.weekday}>{d.weekday}</Text>
        <Text style={styles.lunar}>
          {d.lunarFull} · {d.shengxiao}年
        </Text>
        <Text style={styles.ganzhi}>
          {d.dayGanzhi}日 · {d.dayNayin} · {d.dayWuxing}
        </Text>
        {d.jieqi ? <Text style={styles.jieqi}>{d.jieqi}</Text> : null}
      </Card>

      <View style={styles.split}>
        <Card style={[styles.yj, { borderColor: '#CDE7CF' }]}>
          <Text style={[styles.yjTitle, { color: '#2E7D32' }]}>宜</Text>
          {(d.yi ?? []).slice(0, 8).map((s, i) => (
            <Text key={i} style={styles.yjItem}>
              {s}
            </Text>
          ))}
        </Card>
        <Card style={[styles.yj, { borderColor: '#EAC9C5' }]}>
          <Text style={[styles.yjTitle, { color: colors.danger }]}>忌</Text>
          {(d.ji ?? []).slice(0, 8).map((s, i) => (
            <Text key={i} style={styles.yjItem}>
              {s}
            </Text>
          ))}
        </Card>
      </View>

      <Card>
        <SectionTitle>神煞 · 宜忌参考</SectionTitle>
        <View style={{ gap: 8, marginTop: 8 }}>
          <Row label="冲煞" value={`${d.chong} ${d.chongDesc} · ${d.sha}`} />
          <Row label="值神" value={`${d.zhiXing}`} />
          <Row label="星宿" value={`${d.xiu}（${d.xiuLuck}）`} />
          <Row label="彭祖" value={`${d.pengzuGan} ${d.pengzuZhi}`} />
          <Row label="胎神" value={d.taishen} />
          {d.jiShen?.length ? <Row label="吉神" value={d.jiShen.join('、')} /> : null}
          {d.xiongSha?.length ? <Row label="凶煞" value={d.xiongSha.join('、')} /> : null}
        </View>
      </Card>

      {token ? (
        <FollowUpChat ask={askHuangli} title="问黄历" placeholder="例如：今天适合搬家吗？" />
      ) : null}

      <Text style={styles.footer}>内容仅供娱乐参考</Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, alignItems: 'center', gap: 4 },
  solar: { fontSize: 22, fontWeight: '800', color: colors.ink },
  weekday: { fontSize: 13, color: colors.secondary },
  lunar: { fontSize: 15, color: colors.ink, marginTop: 4 },
  ganzhi: { fontSize: 13, color: colors.secondary },
  jieqi: { fontSize: 13, color: colors.accentDeep, fontWeight: '600', marginTop: 2 },
  split: { flexDirection: 'row', gap: 12 },
  yj: { flex: 1, borderWidth: 1 },
  yjTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  yjItem: { fontSize: 14, color: colors.secondary, lineHeight: 24 },
  row: { flexDirection: 'row', gap: 10 },
  rowLabel: { width: 44, fontSize: 13, color: colors.weak },
  rowValue: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 20 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
