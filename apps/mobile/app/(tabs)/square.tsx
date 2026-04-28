import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mockSquarePosts, mockLeaderboard } from "../../lib/mockData";

const COLORS = {
  bg: "#FAF6EE",
  bgDeep: "#F2EDE0",
  ink: "#1B2540",
  secondary: "#5A5A5A",
  weak: "#9E9E9E",
  accent: "#E87722",
};

export default function SquareScreen() {
  const [likeCounts, setLikeCounts] = useState(mockSquarePosts.map((p) => p.likes));
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");

  function toggleLike(index: number) {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        setLikeCounts((counts) => counts.map((c, i) => (i === index ? c - 1 : c)));
      } else {
        next.add(index);
        setLikeCounts((counts) => counts.map((c, i) => (i === index ? c + 1 : c)));
      }
      return next;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>广场</Text>
        <TouchableOpacity onPress={() => Alert.alert("敬请期待")}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 今日话题卡 */}
        <View style={styles.topicCard}>
          <Text style={styles.topicEmoji}>💭</Text>
          <Text style={styles.topicText}>今天适合做的一个决定？</Text>
          <Text style={styles.topicCount}>1,283 人参与</Text>
          <TouchableOpacity onPress={() => setShowPostModal(true)}>
            <Text style={styles.topicCta}>我也说一句 →</Text>
          </TouchableOpacity>
        </View>

        {/* 匿名分享流 */}
        <Text style={styles.sectionTitle}>匿名分享</Text>
        {mockSquarePosts.map((post, i) => (
          <View key={i} style={styles.postCard}>
            <View style={styles.postHeader}>
              <Text style={styles.postAvatar}>{post.avatar}</Text>
              <Text style={styles.postName}>{post.name}</Text>
            </View>
            <Text style={styles.postContent}>{post.content}</Text>
            <View style={styles.postFooter}>
              <TouchableOpacity
                style={styles.postAction}
                activeOpacity={0.7}
                onPress={() => toggleLike(i)}
              >
                <Text style={[styles.postActionText, likedPosts.has(i) && styles.postActionLiked]}>
                  ❤️ {likeCounts[i]}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.postAction}
                activeOpacity={0.7}
                onPress={() => Alert.alert("敬请期待")}
              >
                <Text style={styles.postActionText}>💬 {post.comments}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* 每日签到榜 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>每日签到榜</Text>
          <View style={styles.myStreakRow}>
            <Text style={styles.myStreakText}>我连续签到：12 天 🔥</Text>
          </View>
          <View style={styles.myRankRow}>
            <Text style={styles.myRankText}>我的排名：第 4 名</Text>
          </View>
          {mockLeaderboard.map((item, i) => (
            <View key={i} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>{i + 1}</Text>
              <Text style={styles.leaderName}>{item.name}</Text>
              <Text style={styles.leaderDays}>{item.days} 天</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 发帖 Modal */}
      <Modal
        visible={showPostModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>我也说一句</Text>
            <TextInput
              style={styles.modalTextInput}
              placeholder="说说你今天的运势感悟..."
              placeholderTextColor={COLORS.weak}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={styles.modalSendBtn}
              activeOpacity={0.8}
              onPress={() => {
                setShowPostModal(false);
                setPostContent("");
                Alert.alert("发布成功");
              }}
            >
              <Text style={styles.modalSendText}>发送</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowPostModal(false)}
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: COLORS.ink },
  searchIcon: { fontSize: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 16 },

  topicCard: { backgroundColor: COLORS.bgDeep, borderRadius: 16, padding: 20, gap: 8, alignItems: "flex-start" },
  topicEmoji: { fontSize: 28 },
  topicText: { fontSize: 18, fontWeight: "700", color: COLORS.ink, lineHeight: 26 },
  topicCount: { fontSize: 13, color: COLORS.weak },
  topicCta: { fontSize: 15, color: COLORS.accent, fontWeight: "600", marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink, paddingTop: 4 },

  postCard: { backgroundColor: COLORS.bgDeep, borderRadius: 16, padding: 16, gap: 10 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  postAvatar: { fontSize: 24 },
  postName: { fontSize: 14, fontWeight: "600", color: COLORS.secondary },
  postContent: { fontSize: 15, color: COLORS.ink, lineHeight: 22 },
  postFooter: { flexDirection: "row", gap: 20, paddingTop: 4 },
  postAction: { flexDirection: "row", alignItems: "center" },
  postActionText: { fontSize: 14, color: COLORS.weak },
  postActionLiked: { color: "#E53935" },

  card: { backgroundColor: COLORS.bgDeep, borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.ink },
  myStreakRow: { backgroundColor: "#FDE8D5", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  myStreakText: { fontSize: 14, color: COLORS.accent, fontWeight: "600" },
  myRankRow: { backgroundColor: "#E8F0FE", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  myRankText: { fontSize: 14, color: "#3B5998", fontWeight: "600" },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  leaderRank: { width: 24, fontSize: 16, fontWeight: "800", color: COLORS.accent, textAlign: "center" },
  leaderName: { flex: 1, fontSize: 15, color: COLORS.ink },
  leaderDays: { fontSize: 14, color: COLORS.secondary },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.ink, textAlign: "center" },
  modalTextInput: {
    borderWidth: 1, borderColor: "#E8E0D0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.ink, minHeight: 100,
  },
  modalSendBtn: { backgroundColor: COLORS.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  modalSendText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  modalCancelBtn: { alignItems: "center", paddingVertical: 8 },
  modalCancelText: { fontSize: 15, color: COLORS.weak },
});
