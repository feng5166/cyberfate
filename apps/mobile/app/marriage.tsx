import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { NeedLogin } from '@/components/gates';
import { SHICHEN, shichenIndexToHour } from '@/lib/profile-store';
import { ApiError, matchMarriage, type MarriageResult } from '@/lib/api';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface Side {
  name: string;
  date: string;
  shichenIdx: number;
}

function isValidDate(d: string) {
  if (!DATE_RE.test(d)) return false;
  const [y, m, day] = d.split('-').map(Number);
  if (y < 1900 || y > 2030) return false;
  const dt = new Date(y, m - 1, day);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === day;
}

export default function MarriageScreen() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);

  const [male, setMale] = useState<Side>({ name: '', date: '', shichenIdx: 0 });
  const [female, setFemale] = useState<Side>({ name: '', date: '', shichenIdx: 0 });
  const [formError, setFormError] = useState<string | null>(null);

  const m = useMutation<MarriageResult, unknown, void>({
    mutationFn: () =>
      matchMarriage({
        maleName: male.name,
        maleBirthDate: male.date,
        maleBirthHour: shichenIndexToHour(male.shichenIdx),
        femaleName: female.name,
        femaleBirthDate: female.date,
        femaleBirthHour: shichenIndexToHour(female.shichenIdx),
      }),
  });

  if (!hydrated) return null;
  if (!token) return <NeedLogin feature="八字合婚" />;

  function submit() {
    setFormError(null);
    if (!isValidDate(male.date) || !isValidDate(female.date)) {
      setFormError('请填写双方有效出生日期（YYYY-MM-DD，年份 1900–2030）');
      return;
    }
    m.mutate();
  }

  const errMsg = m.error instanceof ApiError ? m.error.message : m.error ? '合婚失败，请重试' : null;

  return (
    <Screen>
      <SideForm title="男方" value={male} onChange={setMale} />
      <SideForm title="女方" value={female} onChange={setFemale} />

      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Button title="开始合婚" loading={m.isPending} onPress={submit} />
      <Text style={styles.note}>免费每天 1 次，VIP 不限。</Text>

      {errMsg ? (
        <Card>
          <Text style={styles.error}>{errMsg}</Text>
        </Card>
      ) : null}

      {m.data ? (
        <>
          <Card style={styles.scoreCard}>
            <Text style={styles.score}>{m.data.score}</Text>
            <Text style={styles.scoreLabel}>合婚指数</Text>
            {m.data.highlight ? <Text style={styles.highlight}>{m.data.highlight}</Text> : null}
          </Card>

          {(m.data.dimensions ?? []).map((dim) => (
            <Card key={dim.key} style={{ gap: 6 }}>
              <View style={styles.dimHead}>
                <Text style={styles.dimTitle}>{dim.title}</Text>
                <Text style={styles.dimScore}>{dim.score}</Text>
              </View>
              <Text style={styles.dimContent}>{dim.content}</Text>
            </Card>
          ))}

          {m.data.advices?.length ? (
            <Card>
              <SectionTitle>相处建议</SectionTitle>
              {m.data.advices.map((a, i) => (
                <Text key={i} style={styles.advice}>
                  · {a}
                </Text>
              ))}
            </Card>
          ) : null}

          <Text style={styles.footer}>解读由 AI 生成 · 仅供娱乐参考</Text>
        </>
      ) : null}
    </Screen>
  );
}

function SideForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Side;
  onChange: (s: Side) => void;
}) {
  return (
    <Card style={{ gap: 12 }}>
      <SectionTitle>{title}</SectionTitle>
      <TextInput
        style={styles.input}
        value={value.name}
        onChangeText={(t) => onChange({ ...value, name: t })}
        placeholder="姓名（可选）"
        placeholderTextColor={colors.weak}
        maxLength={20}
      />
      <TextInput
        style={styles.input}
        value={value.date}
        onChangeText={(t) => onChange({ ...value, date: t })}
        placeholder="出生日期 YYYY-MM-DD"
        placeholderTextColor={colors.weak}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SHICHEN.map((label, idx) => (
          <Pressable
            key={label}
            style={[styles.chip, value.shichenIdx === idx && styles.chipActive]}
            onPress={() => onChange({ ...value, shichenIdx: idx })}
          >
            <Text style={[styles.chipText, value.shichenIdx === idx && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  chip: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.secondary },
  chipTextActive: { color: colors.accent, fontWeight: '700' },
  note: { fontSize: 12, color: colors.weak, textAlign: 'center' },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
  scoreCard: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft, alignItems: 'center', gap: 2 },
  score: { fontSize: 48, fontWeight: '800', color: colors.accent },
  scoreLabel: { fontSize: 13, color: colors.secondary },
  highlight: { fontSize: 14, color: colors.ink, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  dimHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dimTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  dimScore: { fontSize: 16, fontWeight: '800', color: colors.accent },
  dimContent: { fontSize: 14, color: colors.secondary, lineHeight: 21 },
  advice: { fontSize: 14, color: colors.secondary, lineHeight: 23 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
