import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { Button, Card, Screen } from '@/components/ui';
import { colors, radius, space } from '@/lib/theme';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-store';
import { saveBirthInfo } from '@/lib/api';
import {
  SHICHEN,
  hourToShichenIndex,
  shichenIndexToHour,
  useProfile,
  type Gender,
} from '@/lib/profile-store';

const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const MIN_DATE = new Date(1900, 0, 1);

function parseISO(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function BirthInputScreen() {
  const router = useRouter();
  const existing = useProfile((s) => s.profile);
  const setProfile = useProfile((s) => s.setProfile);
  const token = useAuth((s) => s.token);

  const [name, setName] = useState(existing?.name ?? '');
  const [gender, setGender] = useState<Gender>(existing?.gender ?? 'male');
  const [date, setDate] = useState<Date | null>(existing?.birthDate ? parseISO(existing.birthDate) : null);
  const [showPicker, setShowPicker] = useState(false);
  const [shichenIdx, setShichenIdx] = useState(
    existing ? hourToShichenIndex(existing.birthHour) : 0,
  );
  const [error, setError] = useState<string | null>(null);

  const maxDate = new Date();

  function onPickDate(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (event.type === 'set' && picked) {
      setDate(picked);
      setError(null);
    }
  }

  async function save() {
    setError(null);
    if (!date) {
      setError('请选择出生日期');
      return;
    }
    const next = {
      name: name.trim(),
      gender,
      birthDate: toISO(date),
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
      <Card style={{ gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <Text style={styles.label}>姓名（可选）</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="可不填"
            placeholderTextColor={colors.faint}
            maxLength={20}
          />
        </View>

        <View style={{ gap: space.sm }}>
          <Text style={styles.label}>性别</Text>
          <View style={styles.row}>
            {(['male', 'female'] as Gender[]).map((g) => (
              <Pressable
                key={g}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === g }}
                accessibilityLabel={g === 'male' ? '男' : '女'}
                style={[styles.choice, gender === g && styles.choiceActive]}
                onPress={() => {
                  haptics.selection();
                  setGender(g);
                }}
              >
                <Text style={[styles.choiceText, gender === g && styles.choiceTextActive]}>
                  {g === 'male' ? '男' : '女'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: space.sm }}>
          <Text style={styles.label}>出生日期（公历）</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={date ? `出生日期 ${toISO(date)}` : '选择出生日期'}
            style={styles.input}
            onPress={() => setShowPicker((v) => !v)}
          >
            <Text style={[styles.dateText, !date && styles.datePlaceholder]}>
              {date ? toISO(date) : '点击选择出生日期'}
            </Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={date ?? new Date(1995, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={maxDate}
              minimumDate={MIN_DATE}
              onChange={onPickDate}
            />
          ) : null}
        </View>

        <View style={{ gap: space.sm }}>
          <Text style={styles.label}>出生时辰</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
            {SHICHEN.map((label, idx) => (
              <Pressable
                key={label}
                accessibilityRole="radio"
                accessibilityState={{ selected: shichenIdx === idx }}
                accessibilityLabel={`时辰 ${label}`}
                style={[styles.chip, shichenIdx === idx && styles.choiceActive]}
                onPress={() => {
                  haptics.selection();
                  setShichenIdx(idx);
                }}
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
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    justifyContent: 'center',
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  dateText: { fontSize: 15, color: colors.ink },
  datePlaceholder: { color: colors.faint },
  row: { flexDirection: 'row', gap: space.md },
  choice: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    height: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentDeep },
  choiceText: { fontSize: 14, color: colors.secondary },
  choiceTextActive: { color: colors.accentDeep, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13 },
});
