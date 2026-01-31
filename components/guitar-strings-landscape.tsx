/**
 * ギター弦表示コンポーネント（横向き版）
 * 6本の弦を横向き画面に最適化して表示
 */

import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import type { GuitarChord } from "@/lib/guitar-chords";

interface GuitarStringsLandscapeProps {
  /** 現在選択されているコード */
  selectedChord: GuitarChord;
  /** 弦がタップされた時のコールバック */
  onStringPress?: (stringNumber: number) => void;
}

const FRET_COUNT = 5; // 表示するフレット数
const STRING_COUNT = 6; // 弦の数

export function GuitarStringsLandscape({
  selectedChord,
  onStringPress,
}: GuitarStringsLandscapeProps) {
  const colors = useColors();

  // 各弦の押さえる位置を計算
  const stringPositions = useMemo(() => {
    const positions: { [key: number]: number } = {};
    selectedChord.fingering.forEach((f) => {
      positions[f.string] = f.fret;
    });
    return positions;
  }, [selectedChord]);

  return (
    <View style={styles.container}>
      {/* コード名表示 */}
      <View style={styles.chordNameContainer}>
        <Text style={[styles.chordName, { color: colors.foreground }]}>
          {selectedChord.displayName}
        </Text>
      </View>

      {/* フレットボード（横向き） */}
      <View style={styles.fretboard}>
        {/* 弦番号と弦表示 */}
        {Array.from({ length: STRING_COUNT }).map((_, i) => {
          const stringNumber = STRING_COUNT - i; // 6弦から1弦の順
          const fretPosition = stringPositions[stringNumber] ?? 0;
          const isMuted = fretPosition === -1;

          return (
            <StringLine
              key={`string-${stringNumber}`}
              stringNumber={stringNumber}
              fretPosition={fretPosition}
              isMuted={isMuted}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                onStringPress?.(stringNumber);
              }}
              colors={colors}
            />
          );
        })}
      </View>

      {/* フレット番号 */}
      <View style={styles.fretNumbers}>
        {Array.from({ length: FRET_COUNT }).map((_, i) => (
          <View key={`fret-num-${i}`} style={styles.fretNumberContainer}>
            <Text style={[styles.fretNumber, { color: colors.muted }]}>{i + 1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface StringLineProps {
  stringNumber: number;
  fretPosition: number;
  isMuted: boolean;
  onPress: () => void;
  colors: any;
}

function StringLine({ stringNumber, fretPosition, isMuted, onPress, colors }: StringLineProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 10 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  // 弦の太さ（6弦が最も太い）
  const stringThickness = 2 + (STRING_COUNT - stringNumber) * 0.5;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.stringLineContainer}
    >
      <Animated.View style={[styles.stringLineContent, animatedStyle]}>
        {/* 弦番号 */}
        <View style={styles.stringNumberContainer}>
          <Text style={[styles.stringNumber, { color: colors.muted }]}>{stringNumber}</Text>
        </View>

        {/* 弦の線 */}
        <View style={styles.stringLineWrapper}>
          <View
            style={[
              styles.stringLine,
              {
                height: stringThickness,
                backgroundColor: isMuted ? colors.error : colors.stringDefault,
                opacity: isMuted ? 0.3 : 1,
              },
            ]}
          />

          {/* フレット位置のマーカー */}
          {!isMuted && fretPosition > 0 && (
            <View
              style={[
                styles.fretMarker,
                {
                  left: `${(fretPosition / 5) * 100}%`,
                  backgroundColor: colors.stringHighlight,
                  borderColor: colors.background,
                },
              ]}
            >
              <Text style={[styles.fretMarkerText, { color: colors.background }]}>
                {fretPosition}
              </Text>
            </View>
          )}

          {/* ミュート表示 */}
          {isMuted && (
            <View style={[styles.mutedMarker, { backgroundColor: colors.error }]}>
              <Text style={[styles.mutedText, { color: colors.background }]}>×</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chordNameContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  chordName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  fretboard: {
    flex: 1,
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  stringLineContainer: {
    height: 32,
    justifyContent: "center",
  },
  stringLineContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stringNumberContainer: {
    width: 28,
    alignItems: "center",
  },
  stringNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  stringLineWrapper: {
    flex: 1,
    height: 32,
    justifyContent: "center",
    position: "relative",
    marginRight: 12,
  },
  stringLine: {
    width: "100%",
    borderRadius: 2,
  },
  fretMarker: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -14,
    top: 2,
  },
  fretMarkerText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  mutedMarker: {
    position: "absolute",
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    top: 2,
  },
  mutedText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  fretNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginTop: 8,
  },
  fretNumberContainer: {
    flex: 1,
    alignItems: "center",
  },
  fretNumber: {
    fontSize: 10,
    fontWeight: "600",
  },
});
