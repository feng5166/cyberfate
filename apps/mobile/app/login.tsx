import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { useProfile } from '@/lib/profile-store';
import { ApiError, mobileLogin, register, saveBirthInfo } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const profile = useProfile((s) => s.profile);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(email.trim(), password, nickname.trim() || undefined);
      }
      const res = await mobileLogin(email.trim(), password);
      await signIn(res.token, res.user);
      // 已有本地出生档案则同步到服务端（每日运势追问等依赖服务端出生信息）
      if (profile) {
        saveBirthInfo(profile).catch(() => {});
      }
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失败，请稍后再试');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Card style={{ gap: 14 }}>
          <View style={styles.tabs}>
            <Text
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => setMode('login')}
            >
              登录
            </Text>
            <Text
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => setMode('register')}
            >
              注册
            </Text>
          </View>

          {mode === 'register' ? (
            <Field label="昵称（可选）">
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="如何称呼你"
                placeholderTextColor={colors.weak}
                maxLength={30}
              />
            </Field>
          ) : null}

          <Field label="邮箱">
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.weak}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </Field>

          <Field label="密码">
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'register' ? '至少8位，含数字' : '请输入密码'}
              placeholderTextColor={colors.weak}
              secureTextEntry
            />
          </Field>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title={mode === 'login' ? '登录' : '注册并登录'} onPress={submit} loading={busy} />
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 20, marginBottom: 4 },
  tab: { fontSize: 18, fontWeight: '700', color: colors.weak, paddingVertical: 4 },
  tabActive: { color: colors.ink, borderBottomWidth: 2, borderBottomColor: colors.accent },
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
  error: { color: colors.danger, fontSize: 13 },
});
