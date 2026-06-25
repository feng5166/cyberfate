import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { ApiError } from '@/lib/api';

interface QA {
  q: string;
  a: string;
}

/**
 * 可复用的「追问」组件。各模块传入自己的 ask(question) 闭包（携带各自上下文）。
 * 追问结果一次性返回（postSSE 缓冲），按问答对累积展示。
 */
export function FollowUpChat({
  ask,
  title = '追问',
  placeholder = '就刚才的结果继续问点什么…',
}: {
  ask: (q: string) => Promise<string>;
  title?: string;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<QA[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    setError(null);
    setBusy(true);
    try {
      const a = await ask(q);
      setHistory((h) => [...h, { q, a: a || '（暂无回答）' }]);
      setInput('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '追问失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: 12 }}>
      <SectionTitle>{title}</SectionTitle>
      {history.map((qa, i) => (
        <View key={i} style={styles.qa}>
          <Text style={styles.q}>Q：{qa.q}</Text>
          <Text style={styles.a}>{qa.a}</Text>
        </View>
      ))}
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        placeholder={placeholder}
        placeholderTextColor={colors.weak}
        maxLength={200}
        multiline
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="发送" loading={busy} onPress={send} />
    </Card>
  );
}

const styles = StyleSheet.create({
  qa: { gap: 4, borderBottomWidth: 1, borderBottomColor: colors.bgDeep, paddingBottom: 10 },
  q: { fontSize: 14, fontWeight: '700', color: colors.ink },
  a: { fontSize: 14, color: colors.secondary, lineHeight: 22 },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
    textAlignVertical: 'top',
  },
  error: { fontSize: 13, color: colors.danger },
});
