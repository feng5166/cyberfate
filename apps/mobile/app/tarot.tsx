import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button, Card, FadeInView, Screen, SectionTitle } from '@/components/ui';
import { colors, space } from '@/lib/theme';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-store';
import { ApiError, drawTarot, type TarotResult } from '@/lib/api';

export default function TarotScreen() {
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const [question, setQuestion] = useState('');

  const m = useMutation<TarotResult, unknown, string>({
    mutationFn: (q: string) => drawTarot(q, 'single'),
    onSuccess: () => haptics.success(),
    onError: () => haptics.warning(),
  });

  const err = m.error;
  const needLogin = err instanceof ApiError && (err.status === 401 || err.code === 'LOGIN_REQUIRED');
  const errMsg =
    err instanceof ApiError ? err.message : err ? '占卜失败，请稍后再试' : null;

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <SectionTitle>单张牌占卜</SectionTitle>
        <Text style={styles.tip}>静心默念你的问题，然后抽取一张塔罗牌。</Text>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="例如：我近期的事业走向如何？"
          placeholderTextColor={colors.weak}
          multiline
          maxLength={100}
        />
        <Button
          title="抽牌占卜"
          loading={m.isPending}
          onPress={() => m.mutate(question.trim() || '我近期的整体运势如何？')}
        />
        <Text style={styles.note}>每天可免费占卜 1 次。</Text>
      </Card>

      {errMsg ? (
        <Card style={{ gap: 10 }}>
          <Text style={styles.error}>{errMsg}</Text>
          {needLogin ? <Button title="去登录" variant="ghost" onPress={() => router.push('/login')} /> : null}
        </Card>
      ) : null}

      {m.data ? (
        <FadeInView style={{ gap: space.lg }}>
          {m.data.cards.map((c, i) => (
            <Card key={i} style={{ gap: 6 }}>
              <Text style={styles.cardName}>
                {c.name_zh || c.name || '塔罗牌'}（{c.orientation === 'reversed' ? '逆位' : '正位'}）
              </Text>
              {c.meaning ? <Text style={styles.cardMeaning}>{c.meaning}</Text> : null}
            </Card>
          ))}
          <Card>
            <SectionTitle>AI 解读</SectionTitle>
            <Text style={styles.reading}>{m.data.reading || '（暂无解读内容）'}</Text>
            {m.data.caution ? <Text style={styles.caution}>{m.data.caution}</Text> : null}
          </Card>
          <Text style={styles.footer}>解读由 AI 生成 · 仅供娱乐参考</Text>
        </FadeInView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  input: {
    minHeight: 80,
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
  cardName: { fontSize: 17, fontWeight: '700', color: colors.accentDeep },
  cardMeaning: { fontSize: 14, color: colors.secondary, lineHeight: 21 },
  reading: { fontSize: 15, color: colors.ink, lineHeight: 24, marginTop: 6 },
  caution: { fontSize: 13, color: colors.weak, marginTop: 10, lineHeight: 19 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
