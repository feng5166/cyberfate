import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { saveBirthInfo } from '@/lib/api';
import {
  SHICHEN,
  hourToShichenIndex,
  shichenIndexToHour,
  useProfile,
  type Gender,
} from '@/lib/profile-store';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function BirthInputScreen() {
  const router = useRouter();
  const existing = useProfile((s) => s.profile);
  const setProfile = useProfile((s) => s.setProfile);
  const token = useAuth((s) => s.token);

  const [name, setName] = useState(existing?.name ?? '');
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'male');
  const [birthDate, setBirthDate] = useState(existing?.birthDate ?? '');
  const [shichenIdx, setShichenIdx] = useState(
    existing ? hourToShichenIndex(existing.birthHour) : 0,
  );
  const [error, setError] = useState<string | null>(null);

  function isValidDate(d: string) {
    if (!DATE_RE.test(d)) return false;
    const [y, m, day] = d.split('-').map(Number);
    if (y < 1900 || y > 2030) return false;
    const dt = new Date(y, m - 1, day);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === day;
  }

  async function save() {
    setError(null);
    if (!isValidDate(birthDate)) {
      setError('请输入有效出生日期（格式 YYYY-MM-DD，年份 1900–2030）');
      return;
    }
    const next = {
      name: name.trim(),
      gender,
      birthDate,
      birthHour: shichenIndexToHour(shichenIdx),
    };
    await setProfile(next);
    // 已登录则同步到服务端（每日运势追问等依赖服务端出生信息）
    if (token) {
      saveBirthInfo(next).catch(() => {});
    }
    router.back();
  }

  return (
    <Screen>
      <Card style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>姓名（可选）</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="可不填"
            placeholderTextColor={colors.weak}
            maxLength={20}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>性别</Text>
          <View style={styles.row}>
            {(['male', 'female'] as Gender[]).map((g) => (
              <Pressable
                key={g}
                style={[styles.choice, gender === g && styles.choiceActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.choiceText, gender === g && styles.choiceTextActive]}>
                  {g === 'male' ? '男' : '女'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>出生日期（公历）</Text>
          <TextInput
            style={styles.input}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="YYYY-MM-DD，例如 1995-08-20"
            placeholderTextColor={colors.weak}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>出生时辰</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {SHICHEN.map((label, idx) => (
              <Pressable
                key={label}
                style={[styles.chip, shichenIdx === idx && styles.choiceActive]}
                onPress={() => setShichenIdx(idx)}
              >
                <Text style={[styles.choiceText, shichenIdx === idx && styles.choiceTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="保存" onPress={save} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, color: colors.secondary },
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
  row: { flexDirection: 'row', gap: 10 },
  choice: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  choiceText: { fontSize: 14, color: colors.secondary },
  choiceTextActive: { color: colors.accent, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13 },
});
