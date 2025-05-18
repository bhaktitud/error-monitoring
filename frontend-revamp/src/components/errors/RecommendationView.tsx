"use client";

import React, { useState, useEffect } from "react";
import { CircleCheck, CircleX, Code, Copy, ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { SolutionRecommendation } from "@/lib/api";

interface RecommendationViewProps {
  errorId: string;
  errorGroupId?: string;
  errorType?: string;
  errorMessage?: string;
}

export default function RecommendationView({
  errorId,
}: RecommendationViewProps) {
  const [recommendations, setRecommendations] = useState<SolutionRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { toast } = useToast();

  // Ambil rekomendasi saat component dimount
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.getSolutionRecommendations(errorId);
        setRecommendations(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setError("Gagal memuat rekomendasi solusi. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [errorId]);

  // Handle copy code ke clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      description: "Kode berhasil disalin ke clipboard",
      duration: 2000,
    });
  };

  // Handle feedback
  const handleFeedback = async (recommendationId: string, isHelpful: boolean) => {
    try {
      await api.provideSolutionFeedback(recommendationId, isHelpful ? "helpful" : "not_helpful");
      
      // Update state lokal
      setRecommendations(prevRecs => 
        prevRecs.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, feedback: isHelpful ? "helpful" : "not_helpful" } 
            : rec
        )
      );

      toast({
        description: "Terima kasih atas feedback Anda!",
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengirim feedback. Silakan coba lagi.",
      });
    }
  };

  // Filter rekomendasi berdasarkan tab aktif
  const filteredRecommendations = recommendations.filter(rec => {
    if (activeTab === "all") return true;
    return rec.source === activeTab;
  });

  // Sortir rekomendasi berdasarkan skor relevansi
  const sortedRecommendations = [...filteredRecommendations].sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  // Render badge untuk source
  const renderSourceBadge = (source: string) => {
    switch (source) {
      case "knowledge_base":
        return <Badge variant="secondary">Knowledge Base</Badge>;
      case "ml":
        return <Badge variant="outline">ML Generated</Badge>;
      case "generic":
        return <Badge variant="outline">Generic</Badge>;
      case "user_feedback":
        return <Badge variant="default">Community</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  // Render badge untuk confidence
  const renderConfidenceBadge = (confidence: number) => {
    let variant = "outline";
    if (confidence >= 0.8) variant = "default";
    else if (confidence >= 0.5) variant = "secondary";
    else variant = "outline";

    return (
      <Badge variant={variant as "outline" | "default" | "secondary"}>
        {Math.round(confidence * 100)}% Confidence
      </Badge>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <div className="space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <Skeleton className="h-[125px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render empty state
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-muted p-3">
          <Code className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Belum ada rekomendasi</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Kami sedang menganalisis error ini. Rekomendasi akan tersedia segera.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  // Hitung jumlah rekomendasi per sumber
  const kbCount = recommendations.filter(r => r.source === "knowledge_base").length;
  const mlCount = recommendations.filter(r => r.source === "ml").length;
  const genericCount = recommendations.filter(r => r.source === "generic").length;
  const userCount = recommendations.filter(r => r.source === "user_feedback").length;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Semua ({recommendations.length})
          </TabsTrigger>
          {kbCount > 0 && (
            <TabsTrigger value="knowledge_base">
              Knowledge Base ({kbCount})
            </TabsTrigger>
          )}
          {mlCount > 0 && (
            <TabsTrigger value="ml">
              ML Generated ({mlCount})
            </TabsTrigger>
          )}
          {genericCount > 0 && (
            <TabsTrigger value="generic">
              Generic ({genericCount})
            </TabsTrigger>
          )}
          {userCount > 0 && (
            <TabsTrigger value="user_feedback">
              Community ({userCount})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
              {sortedRecommendations.map((recommendation) => (
                <Card key={recommendation.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium">
                        {recommendation.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        {renderSourceBadge(recommendation.source)}
                        {renderConfidenceBadge(recommendation.confidence)}
                      </div>
                    </div>
                    <CardDescription>
                      {recommendation.description}
                    </CardDescription>
                  </CardHeader>

                  {recommendation.codeExample && (
                    <CardContent className="pb-0">
                      <div className="relative rounded-md bg-muted p-4">
                        <div className="absolute right-2 top-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopyCode(recommendation.codeExample || "")}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy code</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                          <code>{recommendation.codeExample}</code>
                        </pre>
                      </div>
                    </CardContent>
                  )}

                  <CardFooter className="flex justify-between pt-4">
                    <div className="flex gap-1 text-xs text-muted-foreground">
                      {recommendation.isApplied ? (
                        <span className="flex items-center">
                          <CircleCheck className="mr-1 h-3 w-3 text-green-500" />
                          Sudah diterapkan
                        </span>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {recommendation.feedback ? (
                        <span className="text-xs text-muted-foreground flex items-center">
                          {recommendation.feedback === "helpful" ? (
                            <>
                              <ThumbsUp className="mr-1 h-3 w-3 text-green-500" />
                              Membantu
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="mr-1 h-3 w-3 text-red-500" />
                              Tidak membantu
                            </>
                          )}
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleFeedback(recommendation.id, true)}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Membantu
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleFeedback(recommendation.id, false)}
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                            Tidak membantu
                          </Button>
                        </div>
                      )}

                      {recommendation.source === "knowledge_base" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => window.open("https://docs.example.com/errors", "_blank")}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Lihat Docs
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
} 