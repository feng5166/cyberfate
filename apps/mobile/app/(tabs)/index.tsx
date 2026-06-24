import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Screen } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';

interface ModuleItem {
  key: string;
  label: string;
  icon: string;
  href?: string;
}

const MODULES: ModuleItem[] = [
  { key: 'bazi', label: '八字', icon: '🎴', href: '/bazi' },
  { key: 'daily', label: '每日运势', icon: '🌅', href: '/daily' },
  { key: 'tarot', label: '塔罗', icon: '🃏', href: '/tarot' },
  { key: 'ziwei', label: '紫微斗数', icon: '⭐', href: '/ziwei' },
  { key: 'liuyao', label: '六爻', icon: '☯️', href: '/liuyao' },
  { key: 'meihua', label: '梅花易数', icon: '🌸', href: '/meihua' },
  { key: 'marriage', label: '合婚', icon: '💑', href: '/marriage' },
  { key: 'huangli', label: '黄历', icon: '📅', href: '/huangli' },
  { key: 'music', label: '音乐运势签', icon: '🎵', href: '/music-oracle' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greeting()}，{user?.nickname || '旅人'}
        </Text>
        <Text style={styles.subtitle}>赛博命理 · 今日宜静心问卜</Text>
      </View>

      <Card style={styles.banner}>
        <Text style={styles.bannerTitle}>九大命理 · 一念即得</Text>
        <Text style={styles.bannerDesc}>
          九大模块均已接入真实排盘与 AI 解读。黄历、音乐签无需登录即可体验。
        </Text>
      </Card>

      <View style={styles.grid}>
        {MODULES.map((m) => {
          const enabled = !!m.href;
          return (
            <Pressable
              key={m.key}
              style={({ pressed }) => [styles.cell, pressed && enabled && { opacity: 0.7 }]}
              onPress={() => {
                if (m.href) router.push(m.href as never);
                else Alert.alert(m.label, '该模块即将上线，敬请期待');
              }}
            >
              <View style={[styles.iconWrap, enabled ? styles.iconActive : styles.iconSoon]}>
                <Text style={styles.icon}>{m.icon}</Text>
              </View>
              <Text style={styles.cellLabel}>{m.label}</Text>
              {!enabled ? <Text style={styles.soon}>即将上线</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.ink },
  subtitle: { fontSize: 14, color: colors.weak },
  banner: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  bannerDesc: { fontSize: 13, color: colors.secondary, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '33.33%', alignItems: 'center', paddingVertical: 14, gap: 8 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  iconSoon: { backgroundColor: colors.bgDeep },
  icon: { fontSize: 26 },
  cellLabel: { fontSize: 13, color: colors.ink, fontWeight: '500' },
  soon: { fontSize: 10, color: colors.weak },
});
