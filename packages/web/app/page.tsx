"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, Copy, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner"; // For copy to clipboard feedback

export default function HomePage() {
  const [text, setText] = useState("");
  const [parsedQuery, setParsedQuery] = useState(null);
  const [eventTimestamp, setEventTimestamp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    setError(null); // Clear previous errors
    setLoading(true);
    setParsedQuery(null);
    setEventTimestamp(null);

    if (!text.trim()) {
      setError("Query text cannot be empty.");
      setLoading(false);
      return;
    }

    try {
      // Step 1: POST to /api/parse-query
      const parseResponse = await fetch("/api/parse-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!parseResponse.ok) {
        if (parseResponse.status === 429) {
          setError("Rate limit exceeded. Please try again after a minute.");
        } else if (parseResponse.status === 400) {
          const errData = await parseResponse.json();
          setError(`Invalid Query: ${errData.error || 'Please refine your query.'}`);
        } else {
          setError(`Error parsing query: ${parseResponse.statusText}`);
        }
        setLoading(false);
        return;
      }

      const parsedData = await parseResponse.json();
      setParsedQuery(parsedData);

      // Step 2: Immediately POST that response to /api/find-event
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
          setError(`Invalid Event Search: ${errData.error || 'Please refine your event search criteria.'}`);
        } else {
          setError(`Error finding event: ${findEventResponse.statusText}`);
        }
        setLoading(false);
        return;
      }

      const eventData = await findEventResponse.json();
      setEventTimestamp(eventData.timestamp);
      
      // Scroll result into view
      resultCardRef.current?.scrollIntoView({ behavior: "smooth" });

    } catch (err) {
      console.error("An unexpected error occurred:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTimestamp = () => {
    if (eventTimestamp) {
      navigator.clipboard.writeText(eventTimestamp);
      toast.success("Timestamp copied to clipboard!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      {/* Header Section */}
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Ephemeris Event Engine</h1>
        <p className="text-muted-foreground mt-2">Query astrological events using natural language</p>
      </header>

      {/* Natural Language Query Card */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Natural Language Query</CardTitle>
          <CardDescription>Describe the astrological event you're looking for</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="When does Mars trine Jupiter next?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px]"
            disabled={loading}
          />
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleSubmit} disabled={!text.trim() || loading} className="w-full mt-4">
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
        <CardFooter>
          <p className="text-sm text-muted-foreground">Rate limit: 10 requests per minute</p>
        </CardFooter>
      </Card>

      {/* Result Card */}
      <Card ref={resultCardRef} className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Event Result</CardTitle>
          <CardDescription>Details of the found astrological event</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !eventTimestamp && !parsedQuery && (
            <p className="text-muted-foreground text-center">Submit a query to find the next event.</p>
          )}

          {!loading && eventTimestamp && (
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Next Occurrence</span>
                <span className="text-3xl font-semibold">{eventTimestamp}</span>
              </div>
              <Button variant="outline" onClick={handleCopyTimestamp} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy ISO Timestamp
              </Button>
            </div>
          )}

          {!loading && parsedQuery && (
            <Collapsible className="mt-4">
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
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}