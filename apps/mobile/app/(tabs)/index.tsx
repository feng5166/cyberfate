import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card, Screen } from '@/components/ui';
import { colors, radius, space, type } from '@/lib/theme';
import { useAuth } from '@/lib/auth-store';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface ModuleItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
}

const MODULES: ModuleItem[] = [
  { key: 'bazi', label: '八字', icon: 'pillar', href: '/bazi' },
  { key: 'daily', label: '每日运势', icon: 'white-balance-sunny', href: '/daily' },
  { key: 'tarot', label: '塔罗', icon: 'cards-playing-outline', href: '/tarot' },
  { key: 'ziwei', label: '紫微斗数', icon: 'star-four-points-outline', href: '/ziwei' },
  { key: 'liuyao', label: '六爻', icon: 'yin-yang', href: '/liuyao' },
  { key: 'meihua', label: '梅花易数', icon: 'flower-outline', href: '/meihua' },
  { key: 'marriage', label: '合婚', icon: 'heart-outline', href: '/marriage' },
  { key: 'huangli', label: '黄历', icon: 'calendar-month-outline', href: '/huangli' },
  { key: 'music', label: '音乐运势签', icon: 'music', href: '/music-oracle' },
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
    <Screen withTabBar>
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
        {MODULES.map((m) => (
          <Pressable
            key={m.key}
            accessibilityRole="button"
            accessibilityLabel={m.label}
            style={({ pressed }) => [styles.cell, pressed && { opacity: 0.6 }]}
            onPress={() => router.push(m.href as never)}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name={m.icon} size={26} color={colors.accentDeep} />
            </View>
            <Text style={styles.cellLabel} numberOfLines={1}>
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.ink },
  subtitle: { ...type.bodySm, color: colors.weak },
  banner: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  bannerTitle: { ...type.h2, color: colors.ink, marginBottom: space.sm },
  bannerDesc: { fontSize: 13, color: colors.secondary, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '33.33%', alignItems: 'center', paddingVertical: 14, gap: space.sm },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cellLabel: { fontSize: 13, color: colors.ink, fontWeight: '500' },
});
