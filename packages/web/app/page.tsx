"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, Eye, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { PlanetCard } from '@/components/shared/PlanetCard'; // Import PlanetCard

interface PlanetPosition {
  planet: string;
  longitude: number;
  sign: string;
  degree: number;
}

interface SkyAtResponse {
  planets: PlanetPosition[];
}

function HomeContent() {
  const [text, setText] = useState("");
  const [parsedQuery, setParsedQuery] = useState(null);
  const [eventTimestamp, setEventTimestamp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skyAtData, setSkyAtData] = useState<SkyAtResponse | null>(null); // New state for sky data
  const [skyAtLoading, setSkyAtLoading] = useState(false); // New state for sky data loading
  const [skyAtError, setSkyAtError] = useState<string | null>(null); // New state for sky data error

  const resultCardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Debounce function (moved outside for stability)
  const debounceRef = useRef((func: Function, delay: number) => {
    let timeout: NodeJS.Timeout | undefined;
    const debounced = (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
    debounced.cancel = () => {
      clearTimeout(timeout);
      timeout = undefined;
    };
    return debounced;
  });

  // Effect to update URL query param based on text state
  useEffect(() => {
    const debouncedUpdateUrl = debounceRef.current((newText: string) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      if (newText) {
        currentParams.set('query', newText);
      } else {
        currentParams.delete('query');
      }
      router.replace(`/?${currentParams.toString()}`);
    }, 500); // Debounce by 500ms

    debouncedUpdateUrl(text);

    return () => {
      // Cleanup function for debounce
      debouncedUpdateUrl.cancel();
    };
  }, [text, router, searchParams]);

  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam && queryParam !== text) {
      setText(queryParam);
      handleSubmit(queryParam);
    }
  }, [searchParams]);

  const handleSubmit = async (queryToSubmit?: string) => {
    setError(null);
    setLoading(true);
    setParsedQuery(null);
    setEventTimestamp(null);
    setSkyAtData(null); // Clear sky data on new event search
    setSkyAtError(null); // Clear sky error on new event search

    const query = queryToSubmit || text;

    if (!query.trim()) {
      setError("Query text cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      const parseResponse = await fetch("/api/parse-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: query }),
      });

      if (!parseResponse.ok) {
        if (parseResponse.status === 429) {
          setError("Rate limit exceeded. Please try again after a minute.");
        } else if (parseResponse.status === 400) {
          const errData = await parseResponse.json();
          setError(
            `Invalid Query: ${errData.error || "Please refine your query."}`,
          );
        } else {
          setError(`Error parsing query: ${parseResponse.statusText}`);
        }
        setLoading(false);
        return;
      }

      const parsedData = await parseResponse.json();
      setParsedQuery(parsedData);

      const findEventResponse = await fetch("/api/find-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedData),
      });

      if (!findEventResponse.ok) {
        if (findEventResponse.status === 404) {
          setError("No event found within search parameters.");
        } else if (findEventResponse.status === 400) {
          const errData = await findEventResponse.json();
          setError(
            `Invalid Event Search: ${errData.error || "Please refine your event search criteria."}`,
          );
        } else {
          setError(`Error finding event: ${findEventResponse.statusText}`);
        }
        setLoading(false);
        return;
      }

      const eventData = await findEventResponse.json();
      setEventTimestamp(eventData.timestamp);

      resultCardRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("An unexpected error occurred:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch sky data for the home page
  const fetchSkyData = async () => {
    if (!eventTimestamp) {
      setSkyAtError('No event timestamp available to fetch sky data.');
      return;
    }

    setSkyAtLoading(true);
    setSkyAtError(null);
    setSkyAtData(null);

    try {
      const response = await fetch(`/api/sky-at`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timestamp: eventTimestamp }),
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data: SkyAtResponse = await response.json();
      setSkyAtData(data);
    } catch (err: any) {
      setSkyAtError(err.message || 'Failed to fetch sky data.');
    } finally {
      setSkyAtLoading(false);
    }
  };

  const formattedTimestamp = eventTimestamp
    ? format(parseISO(eventTimestamp), "MMMM do, yyyy h:mm:ss a zzz")
    : "";

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Ephemeris Event Engine</h1>
        <p className="text-muted-foreground mt-2">
          Query astrological events using natural language
        </p>
      </header>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Natural Language Query</CardTitle>
          <CardDescription>
            Describe the astrological event you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="When does Mars trine Jupiter next?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full"
            disabled={loading}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && text.trim()) {
                    handleSubmit();
                }
            }}
          />
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={() => handleSubmit()}
            disabled={!text.trim() || loading}
            className="w-full mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Find Event"
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          {!loading && parsedQuery && (
            <Collapsible className="mt-4 w-full">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-muted-foreground text-sm py-2">
                View Parsed Constraints <ChevronDown className="h-4 w-4" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                  <code>{JSON.stringify(parsedQuery, null, 2)}</code>
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardFooter>
      </Card>

      <Card ref={resultCardRef} className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Event Result</CardTitle>
          <CardDescription>
            Details of the found astrological event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !eventTimestamp && !parsedQuery && (
            <p className="text-muted-foreground text-center">
              Submit a query to find the next event.
            </p>
          )}

          {!loading && eventTimestamp && (
            <div className="space-y-4 flex flex-col items-start"> {/* Added items-start for left alignment */}
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">
                  Next Occurrence
                </span>
                <span className="text-2xl font-semibold">
                  {formattedTimestamp}
                </span>
              </div>
              {!skyAtData && ( // Conditionally render button
                <Button
                  variant="outline"
                  onClick={fetchSkyData}
                  className="mt-4" // Removed w-full, rely on w-fit/inline-block behavior or flex parent
                  disabled={skyAtLoading || !eventTimestamp}
                >
                  {skyAtLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Sky...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      View Sky
                    </>
                  )}
                </Button>
              )}

              {skyAtError && <p className="text-red-500 mt-4">{skyAtError}</p>}

              {skyAtData && skyAtData.planets.length > 0 && (
                <div className="mt-6 border-t pt-4 w-full"> {/* Separator for sky data */}
                  <h3 className="text-xl font-semibold mb-3">Sky Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}