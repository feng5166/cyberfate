import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Button, Card, FadeInView, Screen, SectionTitle } from '@/components/ui';
import { FollowUpChat } from '@/components/FollowUpChat';
import { colors, space } from '@/lib/theme';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-store';
import { NeedLogin } from '@/components/gates';
import { SHICHEN, hourToShichenIndex, shichenIndexToHour, useProfile } from '@/lib/profile-store';
import { ApiError, askMarriage, matchMarriage, type MarriageResult } from '@/lib/api';

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
  const profile = useProfile((s) => s.profile);

  const [male, setMale] = useState<Side>({ name: '', date: '', shichenIdx: 0 });
  const [female, setFemale] = useState<Side>({ name: '', date: '', shichenIdx: 0 });
  const [formError, setFormError] = useState<string | null>(null);

  const fillFromProfile = (setter: (s: Side) => void) => {
    if (!profile) return;
    haptics.selection();
    setter({
      name: profile.name ?? '',
      date: profile.birthDate,
      shichenIdx: hourToShichenIndex(profile.birthHour),
    });
  };

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
    onSuccess: () => haptics.success(),
    onError: () => haptics.warning(),
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
      <SideForm
        title="男方"
        value={male}
        onChange={setMale}
        onUseMine={profile ? () => fillFromProfile(setMale) : undefined}
      />
      <SideForm
        title="女方"
        value={female}
        onChange={setFemale}
        onUseMine={profile ? () => fillFromProfile(setFemale) : undefined}
      />

      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <Button title="开始合婚" loading={m.isPending} onPress={submit} />
      <Text style={styles.note}>免费每天 1 次，VIP 不限。</Text>

      {errMsg ? (
        <Card>
          <Text style={styles.error}>{errMsg}</Text>
        </Card>
      ) : null}

      {m.data ? (
        <FadeInView style={{ gap: space.lg }}>
          <Card style={styles.scoreCard}>
            <Text style={styles.score}>{m.data.score}</Text>
            <Text style={styles.hearts}>{m.data.hearts}</Text>
            <Text style={styles.level}>{m.data.level}</Text>
          </Card>

          <Card style={{ gap: 6 }}>
            <SectionTitle>双方八字</SectionTitle>
            <Text style={styles.baziLine}>
              {m.data.male?.name || male.name || '男方'}：{m.data.maleBazi}
            </Text>
            <Text style={styles.baziLine}>
              {m.data.female?.name || female.name || '女方'}：{m.data.femaleBazi}
            </Text>
          </Card>

          {m.data.details?.length ? (
            <Card>
              <SectionTitle>匹配维度</SectionTitle>
              {m.data.details.map((d, i) => (
                <Text key={i} style={styles.advice}>
                  · {d}
                </Text>
              ))}
            </Card>
          ) : null}

          <FollowUpChat
            ask={(q) =>
              askMarriage(
                {
                  maleBazi: m.data!.maleBazi,
                  femaleBazi: m.data!.femaleBazi,
                  maleName: m.data!.male?.name || male.name || undefined,
                  femaleName: m.data!.female?.name || female.name || undefined,
                  score: m.data!.score,
                  level: m.data!.level,
                },
                q,
              )
            }
            title="合婚追问"
            placeholder="例如：我们相处要注意什么？"
          />

          <Text style={styles.footer}>{m.data.disclaimer || '仅供娱乐参考'}</Text>
        </FadeInView>
      ) : null}
    </Screen>
  );
}

function SideForm({
  title,
  value,
  onChange,
  onUseMine,
}: {
  title: string;
  value: Side;
  onChange: (s: Side) => void;
  onUseMine?: () => void;
}) {
  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.sideHead}>
        <SectionTitle>{title}</SectionTitle>
        {onUseMine ? (
          <Pressable accessibilityRole="button" onPress={onUseMine} hitSlop={8}>
            <Text style={styles.useMine}>填入我的出生信息</Text>
          </Pressable>
        ) : null}
      </View>
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
            accessibilityRole="radio"
            accessibilityState={{ selected: value.shichenIdx === idx }}
            accessibilityLabel={`时辰 ${label}`}
            style={[styles.chip, value.shichenIdx === idx && styles.chipActive]}
            onPress={() => {
              haptics.selection();
              onChange({ ...value, shichenIdx: idx });
            }}
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
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentDeep },
  chipText: { fontSize: 13, color: colors.secondary },
  chipTextActive: { color: colors.accentDeep, fontWeight: '700' },
  sideHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  useMine: { fontSize: 13, color: colors.accentDeep, fontWeight: '600' },
  note: { fontSize: 12, color: colors.weak, textAlign: 'center' },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
  scoreCard: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder, alignItems: 'center', gap: 2 },
  score: { fontSize: 48, fontWeight: '800', color: colors.accentDeep },
  scoreLabel: { fontSize: 13, color: colors.secondary },
  hearts: { fontSize: 18, marginTop: 2 },
  level: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 4 },
  baziLine: { fontSize: 14, color: colors.ink, lineHeight: 22 },
  highlight: { fontSize: 14, color: colors.ink, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  dimHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dimTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  dimScore: { fontSize: 16, fontWeight: '800', color: colors.accentDeep },
  dimContent: { fontSize: 14, color: colors.secondary, lineHeight: 21 },
  advice: { fontSize: 14, color: colors.secondary, lineHeight: 23 },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 4 },
});
