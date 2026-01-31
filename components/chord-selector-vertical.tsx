/**
 * コード選択コンポーネント（縦向き版）
 * 横向き画面用に縦スクロール可能なコードボタン群
 */

import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import type { GuitarChord } from "@/lib/guitar-chords";

interface ChordSelectorVerticalProps {
  /** 利用可能なコードリスト */
  chords: GuitarChord[];
  /** 現在選択されているコード */
  selectedChord: GuitarChord;
  /** コードが選択された時のコールバック */
  onSelectChord: (chord: GuitarChord) => void;
}

export function ChordSelectorVertical({
  chords,
  selectedChord,
  onSelectChord,
}: ChordSelectorVerticalProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.muted }]}>コード</Text>
      <ScrollView
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chords.map((chord) => (
          <ChordButton
            key={chord.name}
            chord={chord}
            isSelected={chord.name === selectedChord.name}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelectChord(chord);
            }}
            colors={colors}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface ChordButtonProps {
  chord: GuitarChord;
  isSelected: boolean;
  onPress: () => void;
  colors: any;
}

function ChordButton({ chord, isSelected, onPress, colors }: ChordButtonProps) {
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

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.button,
          animatedStyle,
          {
            backgroundColor: isSelected ? colors.primary : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            { color: isSelected ? colors.background : colors.foreground },
          ]}
        >
          {chord.name}
        </Text>
        <Text
          style={[
            styles.buttonSubtext,
            { color: isSelected ? colors.background : colors.muted },
          ]}
        >
          {chord.type === "major" ? "M" : "m"}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  scrollContent: {
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
});
