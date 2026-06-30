import { useContext, useEffect, useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { HeaderHeightContext } from '@react-navigation/elements';
import { colors, elevation, radius, space, type } from '@/lib/theme';

export function Screen({
  children,
  scroll = true,
  withTabBar = false,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Tab 屏：底部安全区由 tabBar 接管，避免双重留白 */
  withTabBar?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const headerHeight = useContext(HeaderHeightContext) ?? 0;
  // Tab 屏不再叠加 bottom inset（tabBar 已占安全区）
  const edges: Edge[] = withTabBar ? [] : ['bottom'];

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.staticContent}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <SafeAreaView edges={edges} style={styles.screen}>
        {body}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const isPrimary = variant === 'primary';
  const inert = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      android_ripple={isPrimary ? { color: 'rgba(255,255,255,0.22)' } : { color: colors.accentSoft }}
      style={({ pressed }) => [
        styles.btn,
        isPrimary ? styles.btnPrimary : styles.btnGhost,
        inert && styles.btnDisabled,
        pressed && !inert && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : colors.accentDeep} />
      ) : (
        <Text style={[styles.btnText, isPrimary ? { color: '#fff' } : { color: colors.accentDeep }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Loading({ label = '加载中…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text
        style={styles.errorText}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
      {onRetry ? <Button title="重试" onPress={onRetry} variant="ghost" /> : null}
    </View>
  );
}

/** 骨架占位（柔和呼吸动画），替代整屏裸 spinner */
export function Skeleton({
  width = '100%',
  height = 16,
  rounded = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width, height, borderRadius: rounded, backgroundColor: colors.bgDeep, opacity: pulse }, style]}
    />
  );
}

/** 通用加载骨架：贴近结果页的卡片结构，比整屏 spinner 更不割裂 */
export function ScreenSkeleton({ label }: { label?: string }) {
  return (
    <Screen>
      {label ? (
        <Text style={styles.skeletonLabel} accessibilityRole="text" accessibilityLiveRegion="polite">
          {label}
        </Text>
      ) : null}
      <Card>
        <Skeleton width="45%" height={18} />
        <View style={{ height: space.md }} />
        <Skeleton width="100%" height={48} rounded={radius.md} />
      </Card>
      <Card>
        <Skeleton width="35%" height={16} />
        <View style={{ height: space.md }} />
        <Skeleton width="100%" height={12} />
        <View style={{ height: space.sm }} />
        <Skeleton width="90%" height={12} />
        <View style={{ height: space.sm }} />
        <Skeleton width="80%" height={12} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
  staticContent: { flex: 1, padding: space.lg, gap: space.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  sectionTitle: { ...type.h2, color: colors.ink, marginBottom: space.xs },
  btn: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    overflow: 'hidden',
  },
  btnPrimary: { backgroundColor: colors.accentDeep },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accentDeep },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  btnText: { fontSize: 16, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.md, minHeight: 200 },
  muted: { ...type.bodySm, color: colors.weak },
  errorText: { fontSize: 15, color: colors.danger, textAlign: 'center', lineHeight: 22 },
  skeletonLabel: { ...type.bodySm, color: colors.weak, textAlign: 'center' },
});
