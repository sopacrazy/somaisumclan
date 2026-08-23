// TODO: substituir emoji por imagem real (usar TroopEntry.imagePath quando os ícones estiverem prontos)
import type { ArmyPreset } from '../types';

export const armyPresets: Record<number, ArmyPreset> = {
  8: {
    name: 'GoWiPe',
    troops: [
      { name: 'Golem', emoji: '🗿', quantity: 2 },
      { name: 'Mago', emoji: '🧙', quantity: 8 },
      { name: 'Pekka', emoji: '🤖', quantity: 3 },
      { name: 'Bárbaro', emoji: '⚔️', quantity: 6 },
    ],
    spells: [
      { name: 'Cura', emoji: '💚', quantity: 2 },
      { name: 'Fúria', emoji: '⚡', quantity: 2 },
    ],
    description: 'Golem na frente abrindo caminho para Pekkas e Magos.',
  },
  9: {
    name: 'GoWiPe',
    troops: [
      { name: 'Golem', emoji: '🗿', quantity: 2 },
      { name: 'Mago', emoji: '🧙', quantity: 10 },
      { name: 'Pekka', emoji: '🤖', quantity: 3 },
      { name: 'Curandeira', emoji: '👼', quantity: 1 },
    ],
    spells: [
      { name: 'Cura', emoji: '💚', quantity: 2 },
      { name: 'Fúria', emoji: '⚡', quantity: 2 },
    ],
    description: 'Golem + Pekka com suporte de cura para limpar o núcleo.',
  },
  10: {
    name: 'Hog Riders',
    troops: [
      { name: 'Cavaleiro Porco', emoji: '🐗', quantity: 20 },
      { name: 'Curandeira', emoji: '👼', quantity: 2 },
      { name: 'Mago', emoji: '🧙', quantity: 4 },
    ],
    spells: [
      { name: 'Cura', emoji: '💚', quantity: 3 },
      { name: 'Veneno', emoji: '☠️', quantity: 2 },
    ],
    description: 'Hogs rápidos focando nas defesas, com cura acompanhando.',
  },
  11: {
    name: 'Miner + Bowler',
    troops: [
      { name: 'Mineiro', emoji: '⛏️', quantity: 16 },
      { name: 'Arremessador', emoji: '🎳', quantity: 6 },
      { name: 'Curandeira', emoji: '👼', quantity: 2 },
    ],
    spells: [
      { name: 'Fúria', emoji: '⚡', quantity: 3 },
      { name: 'Veneno', emoji: '☠️', quantity: 2 },
    ],
    description: 'Mineiros ignoram muralhas enquanto Arremessadores limpam tropas.',
  },
  12: {
    name: 'Electro Dragons',
    troops: [
      { name: 'Dragão Elétrico', emoji: '🐲', quantity: 6 },
      { name: 'Balão', emoji: '🎈', quantity: 4 },
      { name: 'Curandeira', emoji: '👼', quantity: 2 },
    ],
    spells: [
      { name: 'Fúria', emoji: '⚡', quantity: 3 },
      { name: 'Gelo', emoji: '❄️', quantity: 1 },
    ],
    description: 'Composição aérea com dano em cadeia dos Dragões Elétricos.',
  },
  13: {
    name: 'Queen Charge Hybrid',
    troops: [
      { name: 'Cavaleiro Porco', emoji: '🐗', quantity: 12 },
      { name: 'Mineiro', emoji: '⛏️', quantity: 12 },
      { name: 'Curandeira', emoji: '👼', quantity: 2 },
    ],
    spells: [
      { name: 'Fúria', emoji: '⚡', quantity: 2 },
      { name: 'Veneno', emoji: '☠️', quantity: 2 },
      { name: 'Congelamento', emoji: '🧊', quantity: 1 },
    ],
    description: 'Rainha abre com Curandeiras, seguida por Hogs e Mineiros.',
  },
  14: {
    name: 'Root Riders',
    troops: [
      { name: 'Cavaleiro Raiz', emoji: '🌱', quantity: 10 },
      { name: 'Mineiro', emoji: '⛏️', quantity: 8 },
      { name: 'Curandeira', emoji: '👼', quantity: 2 },
    ],
    spells: [
      { name: 'Fúria', emoji: '⚡', quantity: 3 },
      { name: 'Invisibilidade', emoji: '🌫️', quantity: 2 },
    ],
    description: 'Cavaleiros Raiz pulando muralhas com suporte de Mineiros.',
  },
  15: {
    name: 'Super Hog Hybrid',
    troops: [
      { name: 'Super Cavaleiro Porco', emoji: '🐗', quantity: 6 },
      { name: 'Cavaleiro Porco', emoji: '🐖', quantity: 10 },
      { name: 'Curandeira', emoji: '👼', quantity: 3 },
    ],
    spells: [
      { name: 'Fúria', emoji: '⚡', quantity: 3 },
      { name: 'Congelamento', emoji: '🧊', quantity: 2 },
    ],
    description: 'Super Hogs abrindo dano nas defesas, Curandeiras sustentando.',
  },
  16: {
    name: 'Blizzard Lalo',
    troops: [
      { name: 'Dragão Elemental', emoji: '🐉', quantity: 4 },
      { name: 'Super Bárbaro', emoji: '💪', quantity: 8 },
      { name: 'Lava Hound', emoji: '🌋', quantity: 2 },
      { name: 'Balão', emoji: '🎈', quantity: 12 },
    ],
    spells: [
      { name: 'Fúria', emoji: '⚡', quantity: 3 },
      { name: 'Gelo', emoji: '❄️', quantity: 2 },
      { name: 'Haste', emoji: '💨', quantity: 2 },
    ],
    description: 'Estratégia aérea para bases CV16.',
  },
};

export function armyPresetFor(townhallLevel: number): ArmyPreset | undefined {
  if (armyPresets[townhallLevel]) return armyPresets[townhallLevel];
  const levels = Object.keys(armyPresets).map(Number).sort((a, b) => a - b);
  const fallback = [...levels].reverse().find((lvl) => lvl <= townhallLevel) ?? levels[0];
  return armyPresets[fallback];
}
