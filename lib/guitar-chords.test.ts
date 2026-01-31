import { describe, it, expect } from "vitest";
import { BEGINNER_CHORDS, getChordByName, getChordsSortedByDifficulty } from "./guitar-chords";

describe("guitar-chords", () => {
  describe("BEGINNER_CHORDS", () => {
    it("should have 9 beginner chords", () => {
      expect(BEGINNER_CHORDS).toHaveLength(9);
    });

    it("should include all expected chord names", () => {
      const chordNames = BEGINNER_CHORDS.map((chord) => chord.name);
      expect(chordNames).toEqual(["C", "G", "D", "Em", "Am", "F", "Dm", "A", "E"]);
    });

    it("should have 6 fingering positions for each chord", () => {
      BEGINNER_CHORDS.forEach((chord) => {
        expect(chord.fingering).toHaveLength(6);
      });
    });

    it("should have valid fret positions (0-5 or -1 for muted)", () => {
      BEGINNER_CHORDS.forEach((chord) => {
        chord.fingering.forEach((f) => {
          expect(f.fret).toBeGreaterThanOrEqual(-1);
          expect(f.fret).toBeLessThanOrEqual(5);
        });
      });
    });

    it("should have valid string numbers (1-6)", () => {
      BEGINNER_CHORDS.forEach((chord) => {
        chord.fingering.forEach((f) => {
          expect(f.string).toBeGreaterThanOrEqual(1);
          expect(f.string).toBeLessThanOrEqual(6);
        });
      });
    });

    it("should have valid finger numbers (0-4)", () => {
      BEGINNER_CHORDS.forEach((chord) => {
        chord.fingering.forEach((f) => {
          expect(f.finger).toBeGreaterThanOrEqual(0);
          expect(f.finger).toBeLessThanOrEqual(4);
        });
      });
    });
  });

  describe("getChordByName", () => {
    it("should return the correct chord for valid name", () => {
      const chord = getChordByName("C");
      expect(chord).toBeDefined();
      expect(chord?.name).toBe("C");
      expect(chord?.displayName).toBe("C (ド)");
    });

    it("should return undefined for invalid name", () => {
      const chord = getChordByName("InvalidChord");
      expect(chord).toBeUndefined();
    });

    it("should work for all beginner chords", () => {
      ["C", "G", "D", "Em", "Am", "F", "Dm", "A", "E"].forEach((name) => {
        const chord = getChordByName(name);
        expect(chord).toBeDefined();
        expect(chord?.name).toBe(name);
      });
    });
  });

  describe("getChordsSortedByDifficulty", () => {
    it("should return all chords", () => {
      const sorted = getChordsSortedByDifficulty();
      expect(sorted).toHaveLength(9);
    });

    it("should sort chords by difficulty in ascending order", () => {
      const sorted = getChordsSortedByDifficulty();
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].difficulty).toBeLessThanOrEqual(sorted[i + 1].difficulty);
      }
    });

    it("should have easiest chords first", () => {
      const sorted = getChordsSortedByDifficulty();
      // Em and Am should be among the easiest (difficulty 1)
      const easiest = sorted.filter((c) => c.difficulty === 1);
      expect(easiest.length).toBeGreaterThan(0);
      expect(easiest.some((c) => c.name === "Em" || c.name === "Am" || c.name === "E")).toBe(true);
    });

    it("should not modify the original array", () => {
      const originalOrder = [...BEGINNER_CHORDS];
      getChordsSortedByDifficulty();
      expect(BEGINNER_CHORDS).toEqual(originalOrder);
    });
  });
});
