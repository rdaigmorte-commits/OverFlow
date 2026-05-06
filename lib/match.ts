export type Profile = {
  id: string;
  name: string;
  games: string[];
  platform: string;
  language: string;
  availability: string[];
  style: string;
  city: string;
};

export type Match = {
  id: string;
  name: string;
  games: string[];
  platform: string;
  language: string;
  availability: string[];
  style: string;
  score: number;
  fitLabel: string;
  fitReason: string;
};

export function computeMatches(current: Profile, others: Profile[]): Match[] {
  return others
    .filter((p) => p.id !== current.id)
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      // Jeux en commun (+40 max)
      const sharedGames = current.games.filter((g) => p.games.includes(g));
      if (sharedGames.length > 0) {
        score += 40;
        reasons.push(`Plays ${sharedGames[0]}`);
      }

      // Même plateforme (+20)
      if (current.platform && p.platform === current.platform) {
        score += 20;
        reasons.push(`Same platform (${p.platform})`);
      }

      // Même langue (+20)
      if (current.language && p.language === current.language) {
        score += 20;
        reasons.push(`Same language`);
      }

      // Disponibilité commune (+20)
      const sharedSlots = current.availability.filter((s) => p.availability.includes(s));
      if (sharedSlots.length > 0) {
        score += 20;
        reasons.push(`Available ${sharedSlots[0]}`);
      }

      const fitLabel =
        score >= 60 ? 'Strong fit' : score >= 40 ? 'Good fit' : 'Worth reaching out';

      return {
        id: p.id,
        name: p.name,
        games: p.games,
        platform: p.platform,
        language: p.language,
        availability: p.availability,
        style: p.style,
        score,
        fitLabel,
        fitReason: reasons.join(' · ') || 'Different profile, could be interesting',
      };
    })
    .sort((a, b) => b.score - a.score);
}
