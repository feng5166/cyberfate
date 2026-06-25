import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { FollowUpChat } from '@/components/FollowUpChat';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { NeedLogin } from '@/components/gates';
import { ApiError, askLiuyao, castLiuyao, type LiuyaoResult } from '@/lib/api';

export default function LiuyaoScreen() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [question, setQuestion] = useState('');

  const m = useMutation<LiuyaoResult, unknown, string>({
    mutationFn: (q: string) => castLiuyao(q),
  });

  if (!hydrated) return null;
  if (!token) return <NeedLogin feature="六爻起卦" />;

  const errMsg = m.error instanceof ApiError ? m.error.message : m.error ? '起卦失败，请重试' : null;
  const meta = m.data?.meta;
  const adv = meta?.actionAdvice;

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <SectionTitle>六爻 · 摇卦问事</SectionTitle>
        <Text style={styles.tip}>默念所问，点击摇卦，以三枚铜钱成卦。</Text>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="例如：这笔投资是否可行？"
          placeholderTextColor={colors.weak}
          maxLength={200}
          multiline
        />
        <Button
          title="摇卦"
          loading={m.isPending}
          onPress={() => m.mutate(question.trim() || '近期运势如何？')}
        />
        <Text style={styles.note}>免费每天 1 次，VIP 不限。</Text>
      </Card>

      {errMsg ? (
        <Card>
          <Text style={styles.error}>{errMsg}</Text>
        </Card>
      ) : null}

      {meta ? (
        <Card style={{ gap: 6 }}>
          <Text style={styles.hexName}>
            {meta.upperSymbol ?? ''}
            {meta.lowerSymbol ?? ''} {meta.hexagramName}
          </Text>
          {meta.upperTrigram || meta.lowerTrigram ? (
            <Text style={styles.trigram}>
              上 {meta.upperTrigram ?? '—'} · 下 {meta.lowerTrigram ?? '—'}
            </Text>
          ) : null}
          {meta.judgment ? <Text style={styles.judgment}>{meta.judgment}</Text> : null}
        </Card>
      ) : null}

      {adv?.summary ? (
        <Card style={{ gap: 8 }}>
          <SectionTitle>行动建议</SectionTitle>
          <Text style={styles.advSummary}>{adv.summary}</Text>
          {adv.positives?.length ? <AdvList title="有利" items={adv.positives} color="#2E7D32" /> : null}
          {adv.cautions?.length ? <AdvList title="注意" items={adv.cautions} color={colors.danger} /> : null}
          {adv.actions?.length ? <AdvList title="建议" items={adv.actions} color={colors.accent} /> : null}
        </Card>
      ) : null}

      {m.data?.reading ? (
        <Card>
          <SectionTitle>详细解读</SectionTitle>
          <Text style={styles.reading}>{m.data.reading}</Text>
          <Text style={styles.footer}>解读由 AI 生成 · 仅供娱乐参考</Text>
        </Card>
      ) : null}

      {meta && m.data?.reading ? (
        <FollowUpChat
          ask={(q) =>
            askLiuyao(
              {
                hexagramName: meta.hexagramName ?? '',
                upperTrigram: meta.upperTrigram ?? '',
                lowerTrigram: meta.lowerTrigram ?? '',
                judgment: meta.judgment ?? '',
                originalQuestion: m.variables ?? '',
                overallNarrative: m.data.reading,
                summary: meta.actionAdvice?.summary ?? '',
              },
              q,
            )
          }
          title="就此卦追问"
          placeholder="例如：这件事大概多久有结果？"
        />
      ) : null}
    </Screen>
  );
}

function AdvList({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={[styles.advTitle, { color }]}>{title}</Text>
      {items.map((s, i) => (
        <Text key={i} style={styles.advItem}>
          · {s}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  input: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
    textAlignVertical: 'top',
  },
  note: { fontSize: 12, color: colors.weak },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
  hexName: { fontSize: 20, fontWeight: '800', color: colors.ink },
  trigram: { fontSize: 13, color: colors.secondary },
  judgment: { fontSize: 14, color: colors.ink, lineHeight: 22, marginTop: 4 },
  advSummary: { fontSize: 15, color: colors.ink, lineHeight: 23 },
  advTitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  advItem: { fontSize: 14, color: colors.secondary, lineHeight: 22 },
  reading: { fontSize: 15, color: colors.ink, lineHeight: 24, marginTop: 6 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 12 },
});
