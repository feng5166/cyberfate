import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { postBazi } from '../lib/api';
import { useAppStore } from '../stores/useAppStore';

const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const SHICHEN_HOURS = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

const YEARS = Array.from({ length: 87 }, (_, i) => 1924 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function BirthInputScreen() {
  const [name, setName] = useState('');
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(6);
  const [day, setDay] = useState(15);
  const [shichen, setShichen] = useState(4);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const setProfile = useAppStore((s) => s.setProfile);
  const setBaziResult = useAppStore((s) => s.setBaziResult);

  if (done) return <Redirect href="/(tabs)" />;

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    const birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const birthHour = SHICHEN_HOURS[shichen];
    setLoading(true);
    try {
      const result = await postBazi({ birthDate, birthHour, gender, name: name.trim() });
      setProfile({ userName: name.trim(), birthDate, birthHour, gender });
      setBaziResult(result);
      setDone(true);
    } catch {
      Alert.alert('计算失败', '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>输入生辰信息</Text>

        <View style={styles.section}>
          <Text style={styles.label}>姓名</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="请输入姓名"
            placeholderTextColor="#9CA3AF"
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>出生年份</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, year === y && styles.pickerItemSelected]}
                  onPress={() => setYear(y)}
                >
                  <Text style={[styles.pickerText, year === y && styles.pickerTextSelected]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>月份</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {MONTHS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerItem, month === m && styles.pickerItemSelected]}
                  onPress={() => setMonth(m)}
                >
                  <Text style={[styles.pickerText, month === m && styles.pickerTextSelected]}>
                    {m}月
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>日期</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, day === d && styles.pickerItemSelected]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.pickerText, day === d && styles.pickerTextSelected]}>
                    {d}日
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>出生时辰</Text>
          <View style={styles.shichenGrid}>
            {SHICHEN.map((s, i) => (
              <TouchableOpacity
                key={s}
                style={[styles.shichenBtn, shichen === i && styles.shichenBtnSelected]}
                onPress={() => setShichen(i)}
              >
                <Text style={[styles.shichenText, shichen === i && styles.shichenTextSelected]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>性别</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnSelected]}
              onPress={() => setGender('male')}
            >
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>
                男
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnSelected]}
              onPress={() => setGender('female')}
            >
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>
                女
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>开始测算</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF6EE',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B2540',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B2540',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5DED0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1B2540',
    backgroundColor: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5DED0',
  },
  pickerItemSelected: {
    backgroundColor: '#E87722',
    borderColor: '#E87722',
  },
  pickerText: {
    fontSize: 14,
    color: '#1B2540',
  },
  pickerTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  shichenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shichenBtn: {
    width: '22%',
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5DED0',
  },
  shichenBtnSelected: {
    backgroundColor: '#E87722',
    borderColor: '#E87722',
  },
  shichenText: {
    fontSize: 18,
    color: '#1B2540',
    fontWeight: '500',
  },
  shichenTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5DED0',
  },
  genderBtnSelected: {
    backgroundColor: '#E87722',
    borderColor: '#E87722',
  },
  genderText: {
    fontSize: 18,
    color: '#1B2540',
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#E87722',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
