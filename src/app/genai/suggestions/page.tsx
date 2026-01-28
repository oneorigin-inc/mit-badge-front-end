'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, CheckCircle, Copy, Info, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { SuggestionCard } from '@/components/genai/suggestion-card';
import { StreamingStatus } from '@/components/genai/streaming-status';
import { PreviousBadgesSection } from '@/components/genai/previous-badges-section';
import { useStreamingSuggestionGenerator } from '@/hooks/use-streaming-suggestion-generator';
import { usePreviousBadges } from '@/hooks/use-previous-badges';
import type { PreviousBadge } from '@/lib/types';

export default function CredentialSuggestionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [originalContent, setOriginalContent] = useState<string>('');
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [isAlertFadingOut, setIsAlertFadingOut] = useState(false);
  const [showNewBadgeGeneration, setShowNewBadgeGeneration] = useState(false);
  const [hasStartedGeneration, setHasStartedGeneration] = useState(false);

  // Hook for fetching previous badges (separate API)
  const {
    previousBadges,
    loading: loadingPreviousBadges,
    hasFetched: hasFetchedPreviousBadges,
    isInitialized: isPreviousBadgesInitialized,
    fetchPreviousBadges,
    shouldRefetch,
  } = usePreviousBadges();

  // Hook for streaming new badge generation (separate API)
  const {
    suggestionCards,
    allCompleted,
    isGenerating,
    generateAllSuggestionsStream,
  } = useStreamingSuggestionGenerator();

  // Detect mobile/tablet
  const isMobile = useIsMobile();

  // Get original content from localStorage on mount
  useEffect(() => {
    try {
      const storedContent = localStorage.getItem('originalContent');
      if (storedContent) {
        setOriginalContent(storedContent);
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      toast({
        variant: 'destructive',
        title: 'Storage Error',
        description: 'Unable to access stored content. Please go back and try again.',
      });
    }
  }, [toast]);

  // Fetch previous badges when page loads with content
  useEffect(() => {
    if (originalContent && isPreviousBadgesInitialized) {
      const generationStarted = localStorage.getItem('generationStarted');
      const needsRefetch = shouldRefetch(originalContent);

      if (generationStarted === 'true') {
        // Clear the flag
        localStorage.removeItem('generationStarted');
        // Clear old generated suggestions for new course
        localStorage.removeItem('generatedSuggestions');
        localStorage.removeItem('finalResponses');
        setShowNewBadgeGeneration(false);
        setHasStartedGeneration(false);
        // Always fetch for new generation
        fetchPreviousBadges(originalContent);
      } else if (needsRefetch) {
        // Course changed, need to fetch new badges and clear old generated suggestions
        localStorage.removeItem('generatedSuggestions');
        localStorage.removeItem('finalResponses');
        setShowNewBadgeGeneration(false);
        setHasStartedGeneration(false);
        fetchPreviousBadges(originalContent);
      }
      // If course is same and we have fetched badges, no need to fetch again
    }
  }, [originalContent, hasFetchedPreviousBadges, fetchPreviousBadges, isPreviousBadgesInitialized, shouldRefetch]);

  // Restore showNewBadgeGeneration state if there are generated suggestions
  useEffect(() => {
    try {
      const storedSuggestions = localStorage.getItem('generatedSuggestions');
      if (storedSuggestions) {
        const suggestions = JSON.parse(storedSuggestions);
        if (suggestions.length > 0 && suggestions.some((s: any) => s.data !== null)) {
          // There are generated suggestions, show the new badge generation section
          setShowNewBadgeGeneration(true);
          setHasStartedGeneration(true);
        }
      }
    } catch (error) {
      console.error('Error restoring generation state:', error);
    }
  }, []);

  // Navigation guard - prevent leaving page while streaming
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = 'You might lose the data halfway. Are you sure you want to leave?';
        return 'You might lose the data halfway. Are you sure you want to leave?';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (isGenerating) {
        const confirmed = window.confirm('You might lose the data halfway. Are you sure you want to leave?');
        if (!confirmed) {
          e.preventDefault();
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isGenerating]);

  // Enhanced navigation handler with confirmation
  const handleNavigation = useCallback((path: string) => {
    if (isGenerating) {
      const confirmed = window.confirm('You might lose the data halfway. Are you sure you want to leave?');
      if (confirmed) {
        router.push(path);
      }
    } else {
      router.push(path);
    }
  }, [isGenerating, router]);

  // Auto-hide completion alert after 5 seconds
  useEffect(() => {
    if (allCompleted && hasStartedGeneration) {
      setShowCompletionAlert(true);
      setIsAlertFadingOut(false);

      const fadeTimer = setTimeout(() => {
        setIsAlertFadingOut(true);
      }, 4500);

      const removeTimer = setTimeout(() => {
        setShowCompletionAlert(false);
      }, 5000);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [allCompleted, hasStartedGeneration]);

  // Handle clicking on a generated suggestion card
  const handleCardClick = (card: any) => {
    if (isMobile) return;

    if (!card.data && !card.error) {
      toast({
        variant: 'destructive',
        title: 'Suggestion Not Ready',
        description: 'This suggestion is still being generated. Please wait for it to complete.',
      });
      return;
    }

    const suggestionData = card.data || {
      title: `Suggestion ${card.id}`,
      description: 'This suggestion failed to generate. You can edit and customize it manually.',
      criteria: 'Please define the criteria for this credential.',
      image: undefined
    };

    const suggestionWithId = {
      ...suggestionData,
      cardId: card.id
    };
    localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(suggestionWithId));
    handleNavigation('/genai/editor');
  };

  const handleCopyOriginal = async () => {
    try {
      await navigator.clipboard.writeText(originalContent || '');
      toast({ title: 'Copied', description: 'Original content copied to clipboard.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Could not copy content.' });
    }
  };

  // Handle "Use This Badge" button - uses badge directly
  const handleUsePreviousBadge = useCallback((badge: PreviousBadge) => {
    const suggestionData = {
      title: badge.badge_name,
      description: badge.badge_description,
      criteria: badge.criteria?.narrative || badge.badge_description,
      image: badge.image_base64 || undefined,
      skills: badge.skills || [],
      cardId: 0,
    };

    localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(suggestionData));
    localStorage.setItem('selectedPreviousBadge', JSON.stringify(badge));

    toast({
      title: 'Badge Selected',
      description: `Using "${badge.badge_name}" as your badge.`,
    });

    handleNavigation('/genai/editor');
  }, [handleNavigation, toast]);

  // Handle clicking on a previous badge card - goes to editor for editing
  const handleEditPreviousBadge = useCallback((badge: PreviousBadge) => {
    const suggestionData = {
      title: badge.badge_name,
      description: badge.badge_description,
      criteria: badge.criteria?.narrative || badge.badge_description,
      image: badge.image_base64 || undefined,
      skills: badge.skills || [],
      cardId: 0,
      isFromPreviousBadge: true,
    };

    localStorage.setItem('selectedBadgeSuggestion', JSON.stringify(suggestionData));
    localStorage.setItem('selectedPreviousBadge', JSON.stringify(badge));

    handleNavigation('/genai/editor');
  }, [handleNavigation]);

  // Handle "Generate New Badge" button - starts streaming generation
  const handleGenerateNewBadge = useCallback(() => {
    setShowNewBadgeGeneration(true);
    setHasStartedGeneration(true);
    // Now call the streaming API
    generateAllSuggestionsStream(originalContent);
  }, [generateAllSuggestionsStream, originalContent]);

  // Get prompt_eval_count from the first card that has metrics
  const promptEvalCount = suggestionCards.find(card => card.data?.metrics?.prompt_eval_count)?.data?.metrics?.prompt_eval_count;

  return (
    <main id="main-content" className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="relative flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-center">
          <Button
            variant="outline"
            onClick={() => handleNavigation('/genai')}
            className="flex-shrink-0 md:absolute md:left-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Generator</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
            Credential Suggestions
          </h1>
        </div>

        <div className="flex justify-center">
          <div className="w-full">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left: Original Content (sticky) - Hidden on mobile/tablet */}
              <div className="hidden lg:block md:col-span-4">
                <div className="sticky top-4">
                  <Card className="border-0 bg-gradient-to-br from-secondary/15 via-secondary/10 to-blue-50/50 shadow-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <h2 className="text-sm font-bold text-primary">Original Content</h2>
                            <p className="text-xs text-secondary font-medium">Source Input</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {promptEvalCount !== undefined && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-pointer">
                                    <Info className="h-4 w-4 text-primary" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Input Tokens: {promptEvalCount}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyOriginal}
                            className="border-secondary bg-white text-secondary hover:bg-secondary hover:text-white transition-all duration-200"
                          >
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                        </div>
                      </div>
                      {originalContent ? (
                        <div className="max-h-[85vh] overflow-auto rounded-lg p-4 bg-white shadow-lg">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">{originalContent}</pre>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 p-4 rounded-lg bg-white/80">
                          No original content found. Go back and add content to generate suggestions.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right: Status + Suggestions */}
              <div className="md:col-span-8 lg:col-span-8">

                {/* Loading Previous Badges */}
                {loadingPreviousBadges && (
                  <div className="flex flex-col items-center py-12 space-y-6 mb-8">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                      <Search className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-primary mb-2">Searching Similar Badges</h3>
                      <p className="text-muted-foreground text-sm">
                        Looking for existing badges that match your content...
                      </p>
                    </div>
                  </div>
                )}

                {/* Previous Badges Section - Shows when fetch is complete and badges found */}
                {!loadingPreviousBadges && hasFetchedPreviousBadges && previousBadges.length > 0 && (
                  <PreviousBadgesSection
                    badges={previousBadges}
                    onUseBadge={handleUsePreviousBadge}
                    onEditBadge={handleEditPreviousBadge}
                    onGenerateNew={handleGenerateNewBadge}
                    isGenerating={isGenerating}
                    isMobile={isMobile}
                  />
                )}

                {/* No Previous Badges Found - Show message and auto-start generation */}
                {!loadingPreviousBadges && hasFetchedPreviousBadges && previousBadges.length === 0 && !showNewBadgeGeneration && (
                  <div className="mb-6">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-blue-700 text-sm mb-4">
                            No similar badges found in our database. Let's generate a new one for you!
                          </p>
                          <Button
                            onClick={handleGenerateNewBadge}
                            className="bg-secondary hover:bg-secondary/90 text-white"
                          >
                            Generate New Badge
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Success Alert - Shows when all suggestions are complete */}
                {showCompletionAlert && (
                  <div
                    className={`mb-6 transition-all duration-500 ${
                      isAlertFadingOut
                        ? 'opacity-0 translate-y-[-10px]'
                        : 'opacity-100 translate-y-0'
                    }`}
                  >
                    <Card className="border-green-500 bg-green-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-center mb-3">
                          <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
                          <h3 className="text-lg font-semibold text-green-800">
                            Suggestion Generated!
                          </h3>
                        </div>
                        <p className="text-green-700 text-sm text-center">
                          Click on the suggestion card below to edit and customize your credential.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* New Badge Generation Section - Shows when user clicks "Generate New Badge" */}
                {showNewBadgeGeneration && (
                  <>
                    {/* Section Header */}
                    {previousBadges.length > 0 && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                        <h3 className="text-sm font-semibold text-primary font-headline">
                          New Badge Generation
                        </h3>
                        <p className="text-xs text-gray-600">
                          Creating a new badge based on your content...
                        </p>
                      </div>
                    )}

                    {/* Streaming Status */}
                    {(isGenerating || suggestionCards.filter(card => card.data).length < suggestionCards.length) && (
                      <div className="mb-4">
                        <StreamingStatus
                          isGenerating={isGenerating}
                          completedCount={suggestionCards.filter(card => card.data).length}
                          totalCount={suggestionCards.length}
                        />
                      </div>
                    )}

                    {/* Show message when no cards are visible yet */}
                    {suggestionCards.filter(card => card.streamingStarted && !card.error).length === 0 && isGenerating && (
                      <div className="flex flex-col items-center py-12 space-y-6 mb-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-primary mb-2">Initializing AI Generation</h3>
                          <p className="text-muted-foreground text-sm">
                            Starting up the AI engines... Cards will appear as streaming begins.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Suggestion Cards */}
                    {suggestionCards.filter(card => card.streamingStarted && !card.error).length > 0 && (
                      <div>
                        {suggestionCards
                          .filter(card => card.streamingStarted && !card.error)
                          .map((card) => (
                            <div key={card.id} className="w-full">
                              <SuggestionCard
                                id={card.id}
                                data={card.data}
                                loading={card.loading}
                                error={card.error}
                                progress={card.progress}
                                streamingText={card.streamingText}
                                streamingContent={card.streamingContent}
                                rawStreamingContent={card.rawStreamingContent}
                                isStreamingComplete={card.isStreamingComplete}
                                onClick={() => handleCardClick(card)}
                                isMobile={isMobile}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
