import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { ApiError, musicOracle, type MusicOracleResult } from '@/lib/api';

export default function MusicOracleScreen() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const m = useMutation<MusicOracleResult, unknown, void>({
    mutationFn: () => {
      const yr = birthYear.trim() ? Number(birthYear.trim()) : undefined;
      return musicOracle(question.trim() || '今天我的运势如何？', yr && !Number.isNaN(yr) ? yr : undefined);
    },
  });

  const err = m.error;
  const needLogin = err instanceof ApiError && err.status === 401;
  const errMsg = err instanceof ApiError ? err.message : err ? '求签失败，请稍后再试' : null;

  return (
    <Screen>
      <Card style={{ gap: 12 }}>
        <SectionTitle>音乐运势签</SectionTitle>
        <Text style={styles.tip}>写下你的心事，求一支专属今日的音乐签。</Text>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="例如：最近适合换工作吗？（1-50 字）"
          placeholderTextColor={colors.weak}
          maxLength={50}
        />
        <TextInput
          style={[styles.input, { minHeight: 46 }]}
          value={birthYear}
          onChangeText={setBirthYear}
          placeholder="出生年份（可选，如 1995）"
          placeholderTextColor={colors.weak}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Button title="求签" loading={m.isPending} onPress={() => m.mutate()} />
        <Text style={styles.note}>游客每天可免费求签 1 次。</Text>
      </Card>

      {errMsg ? (
        <Card style={{ gap: 10 }}>
          <Text style={styles.error}>{errMsg}</Text>
          {needLogin ? <Button title="去登录" variant="ghost" onPress={() => router.push('/login')} /> : null}
        </Card>
      ) : null}

      {m.data?.data ? (
        <>
          <Card style={styles.songCard}>
            <Text style={styles.songName}>{m.data.data.songName}</Text>
            <Text style={styles.artist}>{m.data.data.artist}</Text>
            {m.data.data.lyricsQuote ? (
              <Text style={styles.lyrics}>「{m.data.data.lyricsQuote}」</Text>
            ) : null}
            {m.data.data.musicTags?.length ? (
              <View style={styles.tags}>
                {m.data.data.musicTags.map((t, i) => (
                  <Text key={i} style={styles.tag}>
                    {t}
                  </Text>
                ))}
              </View>
            ) : null}
            {m.data.data.wuxingNote ? <Text style={styles.wuxing}>{m.data.data.wuxingNote}</Text> : null}
          </Card>
          <Card>
            <SectionTitle>签文</SectionTitle>
            <Text style={styles.oracle}>{m.data.oracleText || '（暂无签文）'}</Text>
          </Card>
          <Text style={styles.footer}>内容由 AI 生成 · 仅供娱乐参考</Text>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  note: { fontSize: 12, color: colors.weak },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
  songCard: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft, gap: 6 },
  songName: { fontSize: 20, fontWeight: '800', color: colors.ink },
  artist: { fontSize: 14, color: colors.secondary },
  lyrics: { fontSize: 15, color: colors.accent, fontStyle: 'italic', marginTop: 6, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { fontSize: 12, color: colors.secondary, backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  wuxing: { fontSize: 13, color: colors.secondary, marginTop: 8 },
  oracle: { fontSize: 15, color: colors.ink, lineHeight: 24, marginTop: 6 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
