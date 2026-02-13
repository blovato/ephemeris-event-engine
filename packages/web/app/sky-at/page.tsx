'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns'; // Import date-fns functions
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlanetCard } from '@/components/shared/PlanetCard';

interface PlanetPosition {
  planet: string;
  longitude: number;
  sign: string;
  degree: number;
}

interface SkyAtResponse {
  planets: PlanetPosition[];
}

function SkyAtContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dateTime, setDateTime] = useState('');
  const [submittedDateTime, setSubmittedDateTime] = useState<string | null>(null); // New state variable
  const [skyAtData, setSkyAtData] = useState<SkyAtResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const datetimeParam = searchParams.get('datetime');
    if (datetimeParam) {
      console.log('useEffect: datetimeParam from URL:', datetimeParam);
      try {
        const parsedDate = parseISO(datetimeParam);
        const formattedDate = format(parsedDate, "yyyy-MM-dd'T'HH:mm");
        console.log('useEffect: formattedDate for input:', formattedDate);
        setDateTime(formattedDate);
        handleSubmit(formattedDate); // Submit the formatted date
      } catch (e) {
        console.error('Error parsing or formatting datetimeParam:', e);
        setDateTime(datetimeParam); // Fallback to original if formatting fails
        handleSubmit(datetimeParam); // Attempt submission with original
      }
    } else {
      console.log('useEffect: No datetimeParam in URL.');
      setDateTime(''); // Clear input if no datetimeParam
      setSubmittedDateTime(null); // Also clear submitted date
    }
  }, [searchParams]); // Re-run effect when searchParams change

  const handleSubmit = async (dateToSubmit: string | React.FormEvent) => {
    let date;
    if (typeof dateToSubmit === 'string') {
      date = dateToSubmit;
    } else {
      dateToSubmit.preventDefault();
      date = dateTime;
    }

    if (!date) {
      setError('Please enter a date and time.');
      return;
    }

    setLoading(true);
    setError('');
    setSkyAtData(null);
    setSubmittedDateTime(date); // Store the submitted date

    try {
      console.log('Submitting date:', date);
      const response = await fetch(`/api/sky-at`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: date }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: SkyAtResponse = await response.json();
      setSkyAtData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sky data.');
      setSubmittedDateTime(null); // Clear submitted date on error
    } finally {
      setLoading(false);
    }
  };

  const formattedDisplayDate = submittedDateTime
    ? format(parseISO(submittedDateTime), "MMMM do, yyyy h:mm:ss a zzz")
    : 'N/A';

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">Sky At a Specific Date and Time</h1>

      <form onSubmit={handleSubmit} className="flex space-x-4 mb-8">
        <Input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          placeholder="Enter ISO date (e.g., 2023-01-01T12:00)"
          className="max-w-sm"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Get Sky Data'}
        </Button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {skyAtData && skyAtData.planets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Sky Data for {formattedDisplayDate}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {skyAtData.planets.map((planet) => (
              <PlanetCard
                key={planet.planet}
                planet={planet.planet}
                longitude={planet.longitude}
                sign={planet.sign}
                degree={planet.degree}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function SkyAtPage() {
  return (
    <Suspense fallback={<div>Loading sky data...</div>}>
      <SkyAtContent />
    </Suspense>
  );
}

