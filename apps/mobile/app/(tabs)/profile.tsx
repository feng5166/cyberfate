import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';
import { SHICHEN, hourToShichenIndex, useProfile } from '@/lib/profile-store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const profile = useProfile((s) => s.profile);

  return (
    <Screen>
      <SectionTitle>账号</SectionTitle>
      <Card>
        {user ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.name}>{user.nickname || '未命名'}</Text>
            <Text style={styles.muted}>{user.email}</Text>
            <Text style={styles.badge}>{user.isSubscribed ? '会员' : '免费用户'}</Text>
            <View style={{ height: 8 }} />
            <Button
              title="退出登录"
              variant="ghost"
              onPress={() =>
                Alert.alert('退出登录', '确定退出当前账号吗？', [
                  { text: '取消', style: 'cancel' },
                  { text: '退出', style: 'destructive', onPress: () => signOut() },
                ])
              }
            />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={styles.muted}>登录后可使用「每日运势」AI 解读，并保存历史。</Text>
            <Button title="登录 / 注册" onPress={() => router.push('/login')} />
          </View>
        )}
      </Card>

      <SectionTitle>出生信息</SectionTitle>
      <Card>
        {profile ? (
          <View style={{ gap: 6 }}>
            <Text style={styles.name}>{profile.name || '未填写姓名'}</Text>
            <Text style={styles.muted}>
              {profile.gender === 'male' ? '男' : '女'} · {profile.birthDate} ·{' '}
              {SHICHEN[hourToShichenIndex(profile.birthHour)]}
            </Text>
            <View style={{ height: 8 }} />
            <Button title="编辑出生信息" variant="ghost" onPress={() => router.push('/birth-input')} />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={styles.muted}>填写出生信息后即可排盘与查看运势。</Text>
            <Button title="填写出生信息" onPress={() => router.push('/birth-input')} />
          </View>
        )}
      </Card>

      <Text style={styles.footer}>CyberFate · 内容仅供娱乐参考</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  muted: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
  badge: { alignSelf: 'flex-start', fontSize: 12, color: colors.accent, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.weak, fontSize: 12, marginTop: 8 },
});
