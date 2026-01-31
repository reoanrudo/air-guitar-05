/**
 * 設定画面
 * PC側との接続設定、アプリ設定
 * 世界最高水準のUI/UX
 */

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useP2P } from "@/lib/p2p-provider";

export default function SettingsScreen() {
  const colors = useColors();
  const { roomId, isConnected, connectToPC, disconnect, error } = useP2P();
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomInput, setRoomInput] = useState("");

  const handleConnect = async () => {
    if (isConnected) {
      disconnect();
      return;
    }

    if (!roomInput) {
      Alert.alert("エラー", "Room IDを入力してください");
      return;
    }

    setIsConnecting(true);
    try {
      await connectToPC(roomInput);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error("Connection failed:", e);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <ScreenContainer className="flex-1" edges={["left", "right"]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <Animated.View 
          style={styles.headerSection}
          entering={FadeInDown.delay(100).duration(600)}
        >
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            設定
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            PC側との接続設定
          </Text>
        </Animated.View>

         {/* P2P接続セクション */}
         <Animated.View entering={FadeInDown.delay(200).duration(600)}>
           <Text style={[styles.sectionTitle, { color: colors.foreground }]}>P2P接続</Text>

           {/* Room ID入力カード */}
           <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             <Text style={[styles.cardLabel, { color: colors.muted }]}>PC側のRoom ID</Text>
             <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: roomInput.length === 4 ? colors.primary : colors.border }]}>
               <Text
                 style={[styles.inputText, { color: colors.foreground }]}
               >
                 {roomInput || "____"}
               </Text>
             </View>
             <Text style={[styles.cardHint, { color: colors.muted }]}>
               PC側のWebアプリに表示されている4桁のIDを入力してください
             </Text>

             <View style={styles.keypad}>
               {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").map((char, index) => (
                 <Pressable
                   key={index}
                   onPress={() => {
                     if (roomInput.length < 4) {
                       setRoomInput(roomInput + char);
                       if (Platform.OS !== "web") {
                         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                       }
                     }
                   }}
                   style={({ pressed }) => [
                     styles.keypadButton,
                     {
                       backgroundColor: colors.background,
                       borderColor: colors.border,
                       opacity: pressed ? 0.7 : 1,
                     },
                   ]}
                 >
                   <Text style={[styles.keypadButtonText, { color: colors.foreground }]}>
                     {char}
                   </Text>
                 </Pressable>
               ))}
               <Pressable
                 onPress={() => {
                   setRoomInput(roomInput.slice(0, -1));
                   if (Platform.OS !== "web") {
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                   }
                 }}
                 style={({ pressed }) => [
                   styles.keypadButton,
                   {
                     backgroundColor: colors.error + "20",
                     borderColor: colors.error,
                     opacity: pressed ? 0.7 : 1,
                   },
                 ]}
               >
                 <Text style={[styles.keypadButtonText, { color: colors.error }]}>
                   ⌫
                 </Text>
               </Pressable>
             </View>
           </View>

          {/* 接続状態カード */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <Text style={[styles.cardLabel, { color: colors.muted }]}>接続状態</Text>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? colors.success : colors.error },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.foreground }]}>
                  {isConnected ? "接続中" : "未接続"}
                </Text>
              </View>
            </View>
          </View>

          {/* エラー表示 */}
          {error && (
            <View style={[styles.errorCard, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                ⚠️ {error}
              </Text>
            </View>
          )}

          {/* 接続/切断ボタン */}
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              handleConnect();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: isConnected ? colors.error : colors.primary,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            disabled={isConnecting}
          >
            <Text style={styles.primaryButtonText}>
              {isConnecting ? "接続中..." : isConnected ? "切断" : "接続"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* 使い方セクション */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>使い方</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.instructionList}>
              {[
                { num: "1", text: "PC側でエアギターアプリを起動" },
                { num: "2", text: "上記の接続IDをPC側に入力" },
                { num: "3", text: "「接続」ボタンをタップ" },
                { num: "4", text: "ギター画面でコードを選択" },
                { num: "5", text: "PC側のカメラで右手のストロークを検出" },
                { num: "6", text: "左手のコードに応じた音が鳴ります" },
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
          </View>
        </Animated.View>

        {/* アプリ情報セクション */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>アプリ情報</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.cardLabel, { color: colors.muted }]}>バージョン</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>1.0.0</Text>
            </View>
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }]}>
              <Text style={[styles.cardLabel, { color: colors.muted }]}>プラットフォーム</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {Platform.OS === "ios" ? "iOS" : Platform.OS === "android" ? "Android" : "Web"}
              </Text>
            </View>
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
  headerSection: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 12,
    marginTop: 20,
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
  errorCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  cardHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  inputBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
    alignItems: "center",
  },
  inputText: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  keypadButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  instructionList: {
    gap: 12,
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
  },
});
