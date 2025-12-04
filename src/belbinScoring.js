// src/belbinScoring.js
import { belbinRoles } from "./belbinData";

/**
 * roleMap[segmentId][itemId] = namaRole
 * Contoh saja, silakan sesuaikan dengan tabel scoring Belbin asli.
 */
export const roleMap = {
  I: {
    a: "Resource Investigator",
    b: "Team Worker",
    c: "Plant",
    d: "Co-ordinator",
    e: "Completer Finisher",
    f: "Specialist",
    g: "Implementor",
    h: "Monitor Evaluator",
    i: "Shaper",
  },
  II: {
    a: "Implementor",
    b: "Co-ordinator",
    c: "Resource Investigator",
    d: "Monitor Evaluator",
    e: "Specialist",
    f: "Team Worker",
    g: "Plant",
    h: "Completer Finisher",
    i: "Shaper",
  },
  III: {
    a: "Co-ordinator",
    b: "Completer Finisher",
    c: "Shaper",
    d: "Plant",
    e: "Specialist",
    f: "Resource Investigator",
    g: "Monitor Evaluator",
    h: "Implementor",
    i: "Team Worker",
  },
  IV: {
    a: "Specialist",
    b: "Shaper",
    c: "Monitor Evaluator",
    d: "Implementor",
    e: "Plant",
    f: "Completer Finisher",
    g: "Resource Investigator",
    h: "Co-ordinator",
    i: "Team Worker",
  },
  V: {
    a: "Monitor Evaluator",
    b: "Implementor",
    c: "Team Worker",
    d: "Specialist",
    e: "Resource Investigator",
    f: "Co-ordinator",
    g: "Completer Finisher",
    h: "Plant",
    i: "Shaper",
  },
  VI: {
    a: "Plant",
    b: "Team Worker",
    c: "Co-ordinator",
    d: "Completer Finisher",
    e: "Monitor Evaluator",
    f: "Implementor",
    g: "Shaper",
    h: "Resource Investigator",
    i: "Specialist",
  },
  VII: {
    a: "Shaper",
    b: "Specialist",
    c: "Completer Finisher",
    d: "Resource Investigator",
    e: "Implementor",
    f: "Plant",
    g: "Co-ordinator",
    h: "Team Worker",
    i: "Monitor Evaluator",
  },
};


export function computeBelbinScores(answers) {
  const scores = {};

  // Inisialisasi skor semua role ke 0
  belbinRoles.forEach((role) => {
    scores[role] = 0;
  });

  // Loop tiap segmen
  for (const [segmentId, items] of Object.entries(answers)) {
    const mapForSegment = roleMap[segmentId];
    if (!mapForSegment) continue;

    for (const [itemId, value] of Object.entries(items)) {
      const role = mapForSegment[itemId];
      const numericVal = Number(value) || 0;
      if (role) {
        scores[role] += numericVal;
      }
    }
  }

  return scores;
}
