import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface PlanetCardProps {
  planet: string;
  longitude: number;
  sign: string;
  degree: number;
}

const planetGlyphs: { [key: string]: string } = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

const signGlyphs: { [key: string]: string } = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export function PlanetCard({ planet, longitude, sign, degree }: PlanetCardProps) {
  const planetGlyph = planetGlyphs[planet.toLowerCase()] || '';
  const signGlyph = signGlyphs[sign.toLowerCase()] || '';

  return (
    <Card className="w-[180px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {capitalizeFirstLetter(planet)}
        </CardTitle>
        <span className="text-2xl">{planetGlyph}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{degree.toFixed(2)}°</div>
        <p className="text-xs text-muted-foreground flex items-center">
          <span className="text-lg mr-1">{signGlyph}</span>
          {capitalizeFirstLetter(sign)}
        </p>
        <p className="text-xs text-muted-foreground">
          Longitude: {longitude.toFixed(2)}°
        </p>
      </CardContent>
    </Card>
  );
}
