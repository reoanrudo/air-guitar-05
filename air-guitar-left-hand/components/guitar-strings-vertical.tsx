/**
 * ギター弦表示コンポーネント（弦が縦向き版） - マルチタッチ対応
 * 横向き画面で弦を縦に表示
 * 同時に複数の弦を押すことが可能
 */

import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Platform, Dimensions, PanResponder } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import type { GuitarChord } from "@/lib/guitar-chords";

interface GuitarStringsVerticalProps {
  /** 現在選択されているコード */
  selectedChord: GuitarChord;
  /** 弦がタップされた時のコールバック */
  onStringPress?: (stringNumber: number) => void;
  /** 弦が押さえられている状態が変わった時のコールバック */
  onPressedStringsChange?: (pressedStrings: Set<number>) => void;
}

const FRET_COUNT = 5;
const STRING_COUNT = 6;

export function GuitarStringsVertical({
  selectedChord,
  onStringPress,
  onPressedStringsChange,
}: GuitarStringsVerticalProps) {
  const colors = useColors();
  const [pressedStrings, setPressedStrings] = useState<Set<number>>(new Set());
  const [screenSize, setScreenSize] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height
  });

  // 各弦のフレット位置を計算
  const stringPositions = useMemo(() => {
    const frets: number[] = [0, 0, 0, 0, 0, 0]; // 初期値: 全て開放

    selectedChord.fingering.forEach((f) => {
      const stringIndex = 6 - f.string; // string: 6(E) -> index: 0, string: 1(E) -> index: 5
      if (stringIndex >= 0 && stringIndex < 6) {
        frets[stringIndex] = f.fret === -1 ? 0 : f.fret;
      }
    });

    return { frets };
  }, [selectedChord]);

  // 押さえている弦が変わった時にコールバックを呼ぶ
  useEffect(() => {
    onPressedStringsChange?.(pressedStrings);
  }, [pressedStrings, onPressedStringsChange]);

  // 各弦のPanResponderを作成
  const stringResponders = useMemo(() => {
    return Array.from({ length: STRING_COUNT }).map((_, i) => {
      const stringNumber = STRING_COUNT - i;

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          setPressedStrings((prev) => {
            const newSet = new Set(prev);
            newSet.add(stringNumber);
            return newSet;
          });

          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

          onStringPress?.(stringNumber);
        },
        onPanResponderRelease: () => {
          setPressedStrings((prev) => {
            const newSet = new Set(prev);
            newSet.delete(stringNumber);
            return newSet;
          });
        },
      });
    });
  }, [onStringPress]);

  // 画面サイズ変更を監視
  useEffect(() => {
    const handleDimensionsChange = () => {
      const { width, height } = Dimensions.get("window");
      setScreenSize({ width, height });
    };

    const subscription = Dimensions.addEventListener("change", handleDimensionsChange);
    handleDimensionsChange();

    return () => subscription?.remove();
  }, []);

  const { width: screenWidth, height: screenHeight } = screenSize;

  return (
    <View style={[styles.container, { height: screenHeight, width: screenWidth * 0.82 }]}>
      {/* コード名表示 */}
      <View style={styles.chordNameContainer}>
        <Text style={[styles.chordName, { color: colors.foreground }]}>
          {selectedChord.displayName}
        </Text>
      </View>

      {/* フレット番号（上部） */}
      <View style={styles.fretNumbersTop}>
        {Array.from({ length: FRET_COUNT }).map((_, i) => (
          <View key={`fret-num-${i}`} style={styles.fretNumberItem}>
            <Text style={[styles.fretNumber, { color: colors.muted }]}>{i + 1}</Text>
          </View>
        ))}
      </View>

      {/* 弦を縦に表示 */}
      <View style={styles.stringsContainer}>
        {Array.from({ length: STRING_COUNT }).map((_, i) => {
          const stringNumber = STRING_COUNT - i;
          const stringIndex = STRING_COUNT - 1 - i;
          const fretPosition = stringPositions.frets[stringIndex];
          const isMuted = selectedChord.fingering.some(f => f.string === stringNumber && f.fret === -1);
          const isPressed = pressedStrings.has(stringNumber);
          const responder = stringResponders[i].panHandlers;

          return (
            <View
              key={`string-${stringNumber}`}
              style={[styles.stringTouchable]}
              {...responder}
            >
              <View style={styles.stringWrapper}>
                {/* 弦本体 */}
                <View
                  style={[
                    styles.stringLine,
                    {
                      backgroundColor: isMuted ? "#DC2626" : (isPressed ? "#000000" : "#0F172A"),
                      opacity: isMuted ? 0.5 : 1,
                      shadowColor: isPressed ? "#000000" : "transparent",
                      shadowOpacity: isPressed ? 0.8 : 0,
                      shadowRadius: isPressed ? 6 : 0,
                      elevation: isPressed ? 8 : 0,
                    },
                  ]}
                />

                {/* フレット位置マーカー */}
                {!isMuted && fretPosition > 0 && (
                  <View
                    style={[
                      styles.fretDot,
                      {
                        top: `${(fretPosition / FRET_COUNT) * 100}%`,
                        backgroundColor: isPressed ? "#059669" : "#10B981",
                      },
                    ]}
                  >
                    <Text style={styles.fretDotText}>{fretPosition}</Text>
                  </View>
                )}

                {/* ミュート表示 */}
                {isMuted && (
                  <View style={[styles.mutedDot, { backgroundColor: "#DC2626" }]}>
                    <Text style={styles.mutedText}>×</Text>
                  </View>
                )}

                {/* 弦番号（下部） */}
                <Text style={[styles.stringNumber, { color: colors.muted }]}>
                  {stringNumber}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  chordNameContainer: {
    alignItems: "center",
    marginBottom: 16,
    height: 40,
    justifyContent: "center",
  },
  chordName: {
    fontSize: 32,
    fontWeight: "bold",
  },
  fretNumbersTop: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
    height: 24,
  },
  fretNumberItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fretNumber: {
    fontSize: 11,
    fontWeight: "700",
  },
  stringsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "stretch",
    paddingVertical: 8,
  },
  stringTouchable: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  stringWrapper: {
    flex: 1,
    width: 6,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  stringLine: {
    width: "100%",
    height: "100%",
    borderRadius: 3,
  },
  fretDot: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  fretDotText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  mutedDot: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mutedText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  stringNumber: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
  },
});
