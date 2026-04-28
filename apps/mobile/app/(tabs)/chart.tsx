import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mockBaziChart } from "../../lib/mockData";

const COLORS = {
  bg: "#FAF6EE",
  bgDeep: "#F2EDE0",
  ink: "#1B2540",
  secondary: "#5A5A5A",
  weak: "#9E9E9E",
  accent: "#E87722",
};

const readings = [
  { title: "性格分析", desc: "3段", status: "read" as const },
  { title: "事业财运", desc: "深度", status: "locked" as const },
  { title: "爱情婚姻", desc: "深度", status: "locked" as const },
  { title: "流年大运", desc: "10年", status: "locked" as const },
];

function AnimatedBar({ value, maxValue, color }: { value: number; maxValue: number; color: string }) {
  const [maxWidth, setMaxWidth] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    if (maxWidth > 0) {
      Animated.timing(anim, {
        toValue: (value / maxValue) * maxWidth,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [value, maxValue, maxWidth]);

  return (
    <View
      style={styles.elementBarBg}
      onLayout={(e) => setMaxWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[styles.elementBarFill, { width: anim, backgroundColor: color }]}
      />
    </View>
  );
}

export default function ChartScreen() {
  const [selectedPerson, setSelectedPerson] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerGender, setPartnerGender] = useState<"male" | "female">("male");
  const chart = mockBaziChart;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>命盘</Text>
        <TouchableOpacity onPress={() => Alert.alert("敬请期待")}>
          <Text style={styles.headerAdd}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 切换选择 */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setSelectedPerson(0)}
          >
            <Text style={[styles.tabText, selectedPerson === 0 && styles.tabTextActive]}>
              我自己
            </Text>
            {selectedPerson === 0 && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addPersonBtn}
            onPress={() => Alert.alert("敬请期待")}
          >
            <Text style={styles.addPersonText}>+ 添加家人/朋友</Text>
          </TouchableOpacity>
        </View>

        {/* 八字命盘卡片 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>我的八字命盘</Text>
          <View style={styles.pillarsRow}>
            {chart.pillars.map((p) => (
              <View key={p.position} style={styles.pillarCell}>
                <Text style={styles.pillarPosition}>{p.position}</Text>
                <View style={[styles.pillarStem, styles.pillarShadow]}>
                  <Text style={styles.pillarChar}>{p.heavenlyStem}</Text>
                </View>
                <View style={[styles.pillarBranch, styles.pillarShadow]}>
                  <Text style={styles.pillarChar}>{p.earthlyBranch}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>日主：{chart.dayMaster}</Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaText}>生肖：{chart.zodiac}</Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaText}>纳音：{chart.naYin}</Text>
          </View>
        </View>

        {/* 五行分布 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>五行分布</Text>
          {chart.fiveElements.map((el) => (
            <View key={el.name} style={styles.elementRow}>
              <Text style={styles.elementName}>{el.name}</Text>
              <AnimatedBar value={el.value} maxValue={5} color={el.color} />
              <Text style={styles.elementValue}>{el.value}/5</Text>
            </View>
          ))}
        </View>

        {/* 深度解读列表 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>深度解读</Text>
          {readings.map((r) => (
            <TouchableOpacity
              key={r.title}
              style={styles.readingItem}
              activeOpacity={0.7}
              onPress={() => Alert.alert("敬请期待")}
            >
              <View style={styles.readingLeft}>
                <Text style={styles.readingTitle}>{r.title}</Text>
                <Text style={styles.readingDesc}>（{r.desc}）</Text>
              </View>
              <View style={styles.readingRight}>
                {r.status === "read" ? (
                  <View style={styles.tagRead}>
                    <Text style={styles.tagReadText}>已读</Text>
                  </View>
                ) : (
                  <View style={styles.tagLocked}>
                    <Text style={styles.tagLockedText}>🔒 解锁</Text>
                  </View>
                )}
                <Text style={styles.readingArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 合盘按钮 */}
        <TouchableOpacity
          style={styles.combineBtn}
          activeOpacity={0.8}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.combineBtnText}>+ 与他人合盘</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 合盘 Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>合盘配置</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="对方姓名"
              placeholderTextColor={COLORS.weak}
              value={partnerName}
              onChangeText={setPartnerName}
            />
            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, partnerGender === "male" && styles.genderBtnActive]}
                onPress={() => setPartnerGender("male")}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderText, partnerGender === "male" && styles.genderTextActive]}>
                  男
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderBtn, partnerGender === "female" && styles.genderBtnActive]}
                onPress={() => setPartnerGender("female")}
                activeOpacity={0.8}
              >
                <Text style={[styles.genderText, partnerGender === "female" && styles.genderTextActive]}>
                  女
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              activeOpacity={0.8}
              onPress={() => {
                setShowModal(false);
                Alert.alert("合盘功能开发中");
              }}
            >
              <Text style={styles.modalConfirmText}>确认合盘</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "relative",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.ink },
  headerAdd: {
    position: "absolute",
    right: 0,
    fontSize: 22,
    color: COLORS.accent,
    fontWeight: "400",
    paddingHorizontal: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  tabBar: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 4 },
  tabItem: { alignItems: "center", paddingBottom: 2 },
  tabText: { fontSize: 15, color: COLORS.weak, fontWeight: "500" },
  tabTextActive: { color: COLORS.ink, fontWeight: "700" },
  tabUnderline: { marginTop: 3, height: 2, width: "100%", backgroundColor: COLORS.accent, borderRadius: 1 },
  addPersonBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.accent },
  addPersonText: { fontSize: 13, color: COLORS.accent, fontWeight: "500" },

  card: { backgroundColor: COLORS.bgDeep, borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },

  pillarsRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  pillarCell: { flex: 1, alignItems: "center", gap: 6 },
  pillarPosition: { fontSize: 11, color: COLORS.weak, fontWeight: "500" },
  pillarStem: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: "#EAE2D0",
    alignItems: "center", justifyContent: "center",
  },
  pillarBranch: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: "#E0D8C8",
    alignItems: "center", justifyContent: "center",
  },
  pillarShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pillarChar: { fontSize: 22, fontWeight: "700", color: COLORS.ink },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 4 },
  metaText: { fontSize: 13, color: COLORS.secondary },
  metaDivider: { fontSize: 13, color: COLORS.weak },

  elementRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  elementName: { width: 24, fontSize: 14, color: COLORS.ink, fontWeight: "600" },
  elementBarBg: { flex: 1, height: 10, backgroundColor: "#E8E0D0", borderRadius: 5, overflow: "hidden" },
  elementBarFill: { height: "100%", borderRadius: 5 },
  elementValue: { width: 30, fontSize: 12, color: COLORS.secondary, textAlign: "right" },

  readingItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E8E0D0",
  },
  readingLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  readingRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  readingTitle: { fontSize: 15, color: COLORS.ink, fontWeight: "500" },
  readingDesc: { fontSize: 12, color: COLORS.weak },
  readingArrow: { fontSize: 18, color: COLORS.weak },
  tagRead: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: "#E8E0D0" },
  tagReadText: { fontSize: 12, color: COLORS.weak },
  tagLocked: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: "#FDE8D5" },
  tagLockedText: { fontSize: 12, color: COLORS.accent, fontWeight: "600" },

  combineBtn: { borderWidth: 1.5, borderColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  combineBtnText: { fontSize: 15, color: COLORS.accent, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.ink, textAlign: "center" },
  modalInput: {
    borderWidth: 1, borderColor: "#E8E0D0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.ink,
  },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: "#E8E0D0",
    alignItems: "center",
  },
  genderBtnActive: { borderColor: COLORS.accent, backgroundColor: "#FDE8D5" },
  genderText: { fontSize: 16, color: COLORS.secondary },
  genderTextActive: { color: COLORS.accent, fontWeight: "700" },
  modalConfirmBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  modalConfirmText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  modalCancelBtn: { alignItems: "center", paddingVertical: 8 },
  modalCancelText: { fontSize: 15, color: COLORS.weak },
});
