/**
 * ギター弦表示コンポーネント
 * 6本の弦とフレット位置を視覚的に表現
 */

import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import type { GuitarChord } from "@/lib/guitar-chords";

interface GuitarStringsProps {
  /** 現在選択されているコード */
  selectedChord: GuitarChord;
  /** 弦がタップされた時のコールバック */
  onStringPress?: (stringNumber: number) => void;
}

const FRET_COUNT = 5; // 表示するフレット数
const STRING_COUNT = 6; // 弦の数

export function GuitarStrings({ selectedChord, onStringPress }: GuitarStringsProps) {
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

      {/* フレットボード */}
      <View style={styles.fretboard}>
        {/* フレット線 */}
        <View style={styles.fretLines}>
          {Array.from({ length: FRET_COUNT + 1 }).map((_, i) => (
            <View
              key={`fret-${i}`}
              style={[
                styles.fretLine,
                { backgroundColor: colors.border },
                i === 0 && styles.nutLine,
              ]}
            />
          ))}
        </View>

        {/* 弦 */}
        <View style={styles.stringsContainer}>
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
                  left: `${(fretPosition / FRET_COUNT) * 100}%`,
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
    paddingVertical: 16,
  },
  chordNameContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  chordName: {
    fontSize: 48,
    fontWeight: "bold",
  },
  fretboard: {
    flex: 1,
    position: "relative",
  },
  fretLines: {
    position: "absolute",
    top: 0,
    left: 60,
    right: 20,
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fretLine: {
    width: 2,
    height: "100%",
  },
  nutLine: {
    width: 4,
  },
  stringsContainer: {
    flex: 1,
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  stringLineContainer: {
    height: 40,
    justifyContent: "center",
  },
  stringLineContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stringNumberContainer: {
    width: 40,
    alignItems: "center",
  },
  stringNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  stringLineWrapper: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    position: "relative",
    marginRight: 20,
  },
  stringLine: {
    width: "100%",
    borderRadius: 2,
  },
  fretMarker: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -16,
    top: 4,
  },
  fretMarkerText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  mutedMarker: {
    position: "absolute",
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    top: 4,
  },
  mutedText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  fretNumbers: {
    position: "absolute",
    left: 60,
    right: 20,
    bottom: 0,
    height: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fretNumberContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fretNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
});
