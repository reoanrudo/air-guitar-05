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
  const colors = useColors();

  // コードのフィンガリングをフレット状態配列に変換
  const convertChordToFretStates = (chord: typeof BEGINNER_CHORDS[0]): number[] => {
    const fretStates = [0, 0, 0, 0, 0, 0];
    chord.fingering.forEach(({ string, fret }) => {
      const stringIndex = 6 - string; // string: 6(E) -> index: 0, string: 1(E) -> index: 5
      if (stringIndex >= 0 && stringIndex < 6) {
        fretStates[stringIndex] = fret === -1 ? 0 : fret;
      }
    });
    return fretStates;
  };

  // コードが変更されたらPC側に送信
  useEffect(() => {
    if (isConnected) {
      const fretStates = convertChordToFretStates(selectedChord);
      sendData({
        type: "FRET_UPDATE",
        payload: fretStates,
      });
    }
  }, [selectedChord, isConnected, sendData]);

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
