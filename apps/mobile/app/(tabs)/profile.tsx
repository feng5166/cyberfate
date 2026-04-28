import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../stores/useAppStore";

const COLORS = {
  bg: "#FAF6EE",
  bgDeep: "#F2EDE0",
  ink: "#1B2540",
  secondary: "#5A5A5A",
  weak: "#9E9E9E",
  accent: "#E87722",
};

const DARK_MODE_LABELS: Record<"system" | "light" | "dark", string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

const menuGroup1 = [
  { icon: "📋", label: "我的订单" },
  { icon: "📚", label: "已解锁报告" },
  { icon: "🎴", label: "我的命盘" },
  { icon: "📅", label: "测算历史" },
];

const menuGroup3 = [
  { icon: "💬", label: "反馈" },
  { icon: "ℹ️", label: "关于" },
  { icon: "📞", label: "客服" },
];

function MenuGroup({
  items,
}: {
  items: { icon: string; label: string; rightLabel?: string; onPress?: () => void }[];
}) {
  return (
    <View style={styles.menuGroup}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.menuItem, i < items.length - 1 && styles.menuItemBorder]}
          activeOpacity={0.7}
          onPress={item.onPress ?? (() => Alert.alert("敬请期待"))}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <View style={styles.menuRight}>
            {item.rightLabel ? (
              <Text style={styles.menuRightLabel}>{item.rightLabel}</Text>
            ) : null}
            <Text style={styles.menuArrow}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const { darkMode, setDarkMode } = useAppStore();

  function cycleDarkMode() {
    if (darkMode === "system") setDarkMode("light");
    else if (darkMode === "light") setDarkMode("dark");
    else setDarkMode("system");
  }

  const menuGroup2 = [
    { icon: "⚙️", label: "设置" },
    { icon: "🔔", label: "推送设置" },
    { icon: "🔒", label: "隐私设置" },
    {
      icon: "🌙",
      label: "深色模式",
      rightLabel: DARK_MODE_LABELS[darkMode],
      onPress: cycleDarkMode,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert("敬请期待")}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 用户信息区 */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Frank</Text>
            <Text style={styles.userLink}>cyberfate.app/u/frank</Text>
            <TouchableOpacity
              style={styles.copyBtn}
              activeOpacity={0.7}
              onPress={() => Alert.alert("敬请期待")}
            >
              <Text style={styles.copyBtnText}>复制命运主页 📋</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 会员卡片 - 渐变边框模拟 */}
        <View style={styles.memberCardOuter}>
          <View style={styles.memberCardMiddle}>
            <View style={styles.memberCardInner}>
              <View style={styles.memberTop}>
                <Text style={styles.memberIcon}>💎</Text>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberTitle}>升级会员</Text>
                  <Text style={styles.memberSubtitle}>解锁全部命理深度解读</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>限时 ¥18/月</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.upgradeBtn}
                activeOpacity={0.8}
                onPress={() => Alert.alert("敬请期待")}
              >
                <Text style={styles.upgradeBtnText}>立即升级 →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 功能列表 */}
        <MenuGroup items={menuGroup1} />
        <MenuGroup items={menuGroup2} />
        <MenuGroup items={menuGroup3} />

        {/* 退出登录 */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert("退出登录", "确定要退出登录吗？", [
              { text: "取消", style: "cancel" },
              { text: "退出", style: "destructive", onPress: () => {} },
            ])
          }
        >
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        {/* 版本号 */}
        <Text style={styles.versionText}>v1.0.0 (Build 5)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    paddingHorizontal: 16, paddingVertical: 8,
  },
  headerSpacer: { flex: 1 },
  settingsIcon: { fontSize: 22 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  userCard: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#E8E0D0", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 28 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 20, fontWeight: "700", color: COLORS.ink },
  userLink: { fontSize: 13, color: COLORS.weak },
  copyBtn: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: COLORS.bgDeep, marginTop: 2 },
  copyBtnText: { fontSize: 12, color: COLORS.secondary, fontWeight: "500" },

  memberCardOuter: { borderRadius: 18, backgroundColor: COLORS.accent, padding: 2 },
  memberCardMiddle: { borderRadius: 16, backgroundColor: "#C9A86C", padding: 1.5 },
  memberCardInner: { borderRadius: 15, backgroundColor: COLORS.bgDeep, padding: 16, gap: 12 },
  memberTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  memberIcon: { fontSize: 28 },
  memberInfo: { flex: 1, gap: 2 },
  memberTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  memberSubtitle: { fontSize: 12, color: COLORS.secondary },
  priceBadge: { backgroundColor: "#FDE8D5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  priceText: { fontSize: 12, color: COLORS.accent, fontWeight: "700" },
  upgradeBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  upgradeBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  menuGroup: { backgroundColor: COLORS.bgDeep, borderRadius: 16, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E8E0D0" },
  menuIcon: { fontSize: 18, width: 24, textAlign: "center" },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.ink },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  menuRightLabel: { fontSize: 13, color: COLORS.weak },
  menuArrow: { fontSize: 18, color: COLORS.weak, lineHeight: 20 },

  logoutBtn: { alignItems: "center", paddingVertical: 14, backgroundColor: COLORS.bgDeep, borderRadius: 16 },
  logoutText: { fontSize: 15, color: "#E53935", fontWeight: "600" },
  versionText: { textAlign: "center", fontSize: 12, color: COLORS.weak, paddingBottom: 8 },
});
