'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { PreviousBadgeCard } from './previous-badge-card';
import type { PreviousBadge } from '@/lib/types';

interface PreviousBadgesSectionProps {
  badges: PreviousBadge[];
  onUseBadge: (badge: PreviousBadge) => void;
  onEditBadge: (badge: PreviousBadge) => void;
  onGenerateNew: () => void;
  isGenerating: boolean;
  isMobile?: boolean;
}

export function PreviousBadgesSection({
  badges,
  onUseBadge,
  onEditBadge,
  onGenerateNew,
  isGenerating,
  isMobile = false,
}: PreviousBadgesSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (badges.length === 0) {
    return null;
  }

  return (
    <Card
      className={`overflow-hidden shadow-lg rounded-lg border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 via-white to-primary/5 mb-6 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary font-headline">
                Similar Badges Found ({badges.length})
              </h2>
              <p className="text-xs text-gray-600 font-body">
                We found existing badges similar to your content
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-primary"
          >
            {isCollapsed ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="px-4 pb-4">
          {/* Previous Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {badges.map((badge, index) => (
              <PreviousBadgeCard
                key={index}
                badge={badge}
                index={index}
                onUseBadge={onUseBadge}
                onEditBadge={onEditBadge}
                isMobile={isMobile}
              />
            ))}
          </div>

          {/* Generate New Badge Button */}
          <div className="flex justify-center pt-4 border-t border-gray-200">
            <Button
              onClick={onGenerateNew}
              variant="outline"
              disabled={isGenerating}
              className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 px-6"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  Generating New Badge...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate New Badge Instead
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
