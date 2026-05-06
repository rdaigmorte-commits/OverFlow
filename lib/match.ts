export type Match = {
  name: string;
  game: string;
  platform: string;
  language: string;
  availability: string;
  fitLabel: string;
  fitReason: string;
};

export const demoMatches: Match[] = [
  { name: 'Mika', game: 'Valorant', platform: 'PC', language: 'English', availability: 'Evenings', fitLabel: 'Strong fit', fitReason: 'Same game, same language, same time slot' },
  { name: 'Sara', game: 'Rocket League', platform: 'PC', language: 'English', availability: 'Weekends', fitLabel: 'Good fit', fitReason: 'Same city, same platform, shared casual/co-op vibe' },
  { name: 'Noah', game: 'CS2', platform: 'PC', language: 'English', availability: 'After 20:00', fitLabel: 'Worth reaching out', fitReason: 'Compatible schedule and competitive style' },
];
