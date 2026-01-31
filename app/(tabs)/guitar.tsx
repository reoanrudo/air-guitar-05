/**
 * ギター画面
 * メインのギター操作画面（横向き対応、弦が縦向き）
 * 世界最高水準のUI/UX
 */

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { ScreenContainer } from "@/components/screen-container";
import { GuitarStringsVertical } from "@/components/guitar-strings-vertical";
import { ChordSelectorVertical } from "@/components/chord-selector-vertical";
import { BEGINNER_CHORDS } from "@/lib/guitar-chords";
import { useP2P } from "@/lib/p2p-provider";
import { useColors } from "@/hooks/use-colors";

export default function GuitarScreen() {
  const [selectedChord, setSelectedChord] = useState(BEGINNER_CHORDS[0]); // デフォルトはC
  const [pressedStrings, setPressedStrings] = useState<Set<number>>(new Set());
  const { sendData, isConnected } = useP2P();
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const colors = useColors();

  // コードが変更されたらPC側に送信
  useEffect(() => {
    if (isConnected) {
      sendData({
        type: "chord_change",
        chord: selectedChord.name,
        fingering: selectedChord.fingering,
      });
    }
  }, [selectedChord, isConnected, sendData]);

  // 押さえている弦の状態が変わった時の処理
  useEffect(() => {
    // 前の送信タイマーをクリア
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    // 弦が押さえられている場合、継続的に状態を送信
    if (pressedStrings.size > 0 && isConnected) {
      // 初回送信
      sendData({
        type: "strings_pressed",
        strings: Array.from(pressedStrings),
        chord: selectedChord.name,
      });

      // 100msごとに状態を送信（PC側でリアルタイム反応を維持）
      sendIntervalRef.current = setInterval(() => {
        sendData({
          type: "strings_pressed",
          strings: Array.from(pressedStrings),
          chord: selectedChord.name,
        });
      }, 100);
    } else if (pressedStrings.size === 0 && isConnected) {
      // 弦が全て離された時
      sendData({
        type: "strings_released",
        chord: selectedChord.name,
      });
    }

    return () => {
      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current);
      }
    };
  }, [pressedStrings, isConnected, selectedChord, sendData]);

  const handleStringPress = (stringNumber: number) => {
    // 初回タップ時の通知（onPressedStringsChangeで処理される）
  };

  const handlePressedStringsChange = (newPressedStrings: Set<number>) => {
    setPressedStrings(newPressedStrings);
  };

  return (
    <ScreenContainer 
      className="flex-1"
      edges={["left", "right"]}
      containerClassName="flex-1"
    >
      <Animated.View 
        style={styles.mainContainer}
        entering={FadeIn.duration(400)}
      >
        {/* ステータスバー */}
        <View style={[styles.statusBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.statusText, { color: colors.muted }]}>
            {isConnected ? "🟢 接続中" : "🔴 未接続"}
          </Text>
        </View>

        {/* メインコンテンツ */}
        <View style={styles.contentArea}>
          {/* 左側：コード選択エリア */}
          <View style={styles.leftPanel}>
            <ChordSelectorVertical
              chords={BEGINNER_CHORDS}
              selectedChord={selectedChord}
              onSelectChord={setSelectedChord}
            />
          </View>

          {/* 右側：ギター弦表示エリア（弦が縦向き） */}
          <View style={styles.rightPanel}>
            <GuitarStringsVertical 
              selectedChord={selectedChord} 
              onStringPress={handleStringPress}
              onPressedStringsChange={handlePressedStringsChange}
            />
          </View>
        </View>

        {/* フッターバー */}
        <View style={[styles.footerBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            左手でコードを選択 • 右手でストロークを検出
          </Text>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: "column",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  contentArea: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    width: "18%",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  rightPanel: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
