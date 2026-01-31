import { ScrollView, Text, View, Pressable, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useP2P } from "@/lib/p2p-provider";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const { isConnected, roomId } = useP2P();
  const colors = useColors();

  // デバッグ: roomIdの値をログに出力
  console.log('🔍 Debug roomId:', roomId, 'Length:', roomId?.length, 'Value:', JSON.stringify(roomId));

  const handleStartPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/guitar");
  };

  return (
    <ScreenContainer 
      className="flex-1" 
      edges={["left", "right"]}
      containerClassName="flex-1"
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {/* ギターロゴ（上部） */}
        <Animated.View 
          style={styles.logoSection}
          entering={FadeInDown.delay(100).duration(600)}
        >
          <Text style={styles.guitarEmoji}>🎸</Text>
        </Animated.View>

        {/* タイトル */}
        <Animated.View 
          style={styles.titleSection}
          entering={FadeInDown.delay(200).duration(600)}
        >
          <Text style={[styles.appTitle, { color: colors.foreground }]}>
            Air Guitar
          </Text>
          <Text style={[styles.appSubtitle, { color: colors.primary }]}>
            Left Hand
          </Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            ギター体験を、指先から
          </Text>
        </Animated.View>

        {/* 接続状態カード */}
        <Animated.View 
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInUp.delay(300).duration(600)}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>接続状態</Text>
            <View style={styles.statusIndicator}>
              <Animated.View
                style={[
                  styles.statusDot,
                  { 
                    backgroundColor: isConnected ? colors.success : colors.error,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.foreground }]}>
                {isConnected ? "接続中" : "未接続"}
              </Text>
            </View>
          </View>
          {!isConnected && (
            <Text style={[styles.cardHint, { color: colors.muted }]}>
              設定画面でPC側と接続してください
            </Text>
          )}
        </Animated.View>

        {/* Room IDカード */}
        <Animated.View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInUp.delay(350).duration(600)}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.muted }]}>Room ID</Text>
            <Pressable
              onPress={() => router.push("/settings")}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>編集</Text>
            </Pressable>
          </View>
          {roomId ? (
            <View style={styles.roomIdContainer}>
              <Text style={[styles.roomIdText, { color: colors.primary }]}>
                {roomId.toUpperCase()}
              </Text>
              <Text style={[styles.roomIdHint, { color: colors.muted }]}>
                PC側にこのIDを入力してください
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/settings")}
              style={({ pressed }) => [
                styles.setRoomIdButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={styles.setRoomIdButtonText}>Room IDを設定</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* スタートボタン */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Pressable
            onPress={handleStartPress}
            style={({ pressed }) => [
              styles.startButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text style={[styles.startButtonText, { color: "#FFFFFF" }]}>
              ギター画面へ
            </Text>
            <Text style={[styles.startButtonSubtext, { color: "#FFFFFF" }]}>
              →
            </Text>
          </Pressable>
        </Animated.View>

        {/* 説明文 */}
        <Animated.View 
          style={styles.descriptionSection}
          entering={FadeInUp.delay(500).duration(600)}
        >
          <Text style={[styles.description, { color: colors.muted }]}>
            スマホを横に持ち、左手でコードを操作。PC側のカメラが右手のストロークを検出し、選択したコードの音が鳴ります。
          </Text>
        </Animated.View>

        {/* 使い方カード */}
        <Animated.View 
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          entering={FadeInUp.delay(600).duration(600)}
        >
          <Text style={[styles.cardLabel, { color: colors.muted }]}>使い方</Text>
          <View style={styles.instructionList}>
            {[
              { num: "1", text: "設定画面でPC側と接続" },
              { num: "2", text: "ギター画面でコードを選択" },
              { num: "3", text: "PC側のカメラで右手のストロークを検出" },
              { num: "4", text: "選択したコードの音が鳴ります" },
            ].map((item, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={[styles.instructionNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.instructionNumberText}>{item.num}</Text>
                </View>
                <Text style={[styles.instructionText, { color: colors.foreground }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    paddingVertical: 28,
  },
  guitarEmoji: {
    fontSize: 120,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  startButtonSubtext: {
    fontSize: 18,
    fontWeight: "700",
  },
  descriptionSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "500",
  },
  instructionList: {
    marginTop: 12,
    gap: 10,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  instructionText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  roomIdContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  roomIdText: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: 8,
    fontFamily: "monospace",
  },
  roomIdHint: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  setRoomIdButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  setRoomIdButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
