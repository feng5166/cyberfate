import { StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { NeedLogin } from '@/components/gates';
import { ApiError, drawMeihua, type MeihuaResult } from '@/lib/api';

export default function MeihuaScreen() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);

  const m = useMutation<MeihuaResult, unknown, void>({ mutationFn: () => drawMeihua() });

  if (!hydrated) return null;
  if (!token) return <NeedLogin feature="梅花易数" />;

  const errMsg = m.error instanceof ApiError ? m.error.message : m.error ? '起卦失败，请重试' : null;
  const meta = m.data?.meta;

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <SectionTitle>梅花易数 · 时间起卦</SectionTitle>
        <Text style={styles.tip}>静心默念所问之事，以当下时间起卦。</Text>
        <Button title="一键起卦" loading={m.isPending} onPress={() => m.mutate()} />
        <Text style={styles.note}>免费每天 1 次，VIP 不限。</Text>
      </Card>

      {errMsg ? (
        <Card>
          <Text style={styles.error}>{errMsg}</Text>
        </Card>
      ) : null}

      {meta ? (
        <Card>
          <View style={styles.guaRow}>
            <Gua title="本卦" name={meta.primary?.guaName || meta.guaName} side={meta.primary} />
            <Text style={styles.arrow}>→</Text>
            <Gua title="变卦" name={meta.changed?.guaName || meta.changedGuaName} side={meta.changed} />
          </View>
          {meta.movingLine ? <Text style={styles.moving}>动爻：第 {meta.movingLine} 爻</Text> : null}
        </Card>
      ) : null}

      {m.data?.reading ? (
        <Card>
          <SectionTitle>卦象解读</SectionTitle>
          <Text style={styles.reading}>{m.data.reading}</Text>
          <Text style={styles.footer}>解读由 AI 生成 · 仅供娱乐参考</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

function Gua({
  title,
  name,
  side,
}: {
  title: string;
  name?: string;
  side?: { upper?: { name?: string }; lower?: { name?: string } };
}) {
  return (
    <View style={styles.gua}>
      <Text style={styles.guaTitle}>{title}</Text>
      <Text style={styles.guaName}>{name || '—'}</Text>
      {side?.upper?.name || side?.lower?.name ? (
        <Text style={styles.guaTrigram}>
          {side?.upper?.name ?? '?'} / {side?.lower?.name ?? '?'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  note: { fontSize: 12, color: colors.weak },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
  guaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  gua: { alignItems: 'center', gap: 4, flex: 1 },
  guaTitle: { fontSize: 12, color: colors.weak },
  guaName: { fontSize: 20, fontWeight: '800', color: colors.ink },
  guaTrigram: { fontSize: 12, color: colors.secondary },
  arrow: { fontSize: 20, color: colors.accent, paddingHorizontal: 4 },
  moving: { textAlign: 'center', fontSize: 13, color: colors.accent, marginTop: 12, fontWeight: '600' },
  reading: { fontSize: 15, color: colors.ink, lineHeight: 24, marginTop: 6 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 12 },
});
