'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit3 } from 'lucide-react';
import type { PreviousBadge } from '@/lib/types';

interface PreviousBadgeCardProps {
  badge: PreviousBadge;
  index: number;
  onUseBadge: (badge: PreviousBadge) => void;
  onEditBadge: (badge: PreviousBadge) => void;
  isMobile?: boolean;
}

export function PreviousBadgeCard({ badge, index, onUseBadge, onEditBadge, isMobile = false }: PreviousBadgeCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100); // Stagger animation by index
    return () => clearTimeout(timer);
  }, [index]);

  const similarityPercentage = Math.round(badge.similarity_score * 100);

  // Get badge color based on similarity score
  const getSimilarityColor = () => {
    if (similarityPercentage >= 85) return 'bg-green-100 text-green-800 border-green-300';
    if (similarityPercentage >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (similarityPercentage >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Handle card click for editing (desktop only)
  const handleCardClick = () => {
    if (!isMobile) {
      onEditBadge(badge);
    }
  };

  return (
    <Card
      onClick={handleCardClick}
      className={`overflow-hidden shadow-md transition-all duration-500 rounded-lg border-2 border-transparent hover:border-secondary/50 hover:shadow-lg bg-gradient-to-br from-white to-gray-50 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${!isMobile ? 'cursor-pointer' : ''}`}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Similarity Score Badge */}
        <div className="flex justify-between items-start mb-3">
          <Badge className={`text-xs font-semibold px-2 py-1 ${getSimilarityColor()}`}>
            {similarityPercentage}% match
          </Badge>
          {!isMobile && (
            <Edit3 className="h-4 w-4 text-gray-400 hover:text-secondary transition-colors" />
          )}
        </div>

        {/* Badge Image */}
        {badge.image_base64 && (
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg blur-md"></div>
              <img
                src={badge.image_base64}
                alt={`${badge.badge_name} badge`}
                className="relative w-24 h-24 object-contain rounded-lg border border-gray-200 shadow-sm bg-white"
              />
            </div>
          </div>
        )}

        {/* Badge Name */}
        <h3 className="font-bold text-primary text-sm font-headline text-center mb-2 line-clamp-2">
          {badge.badge_name}
        </h3>

        {/* Badge Description */}
        <p className="text-gray-600 text-xs leading-relaxed font-body line-clamp-3 flex-grow">
          {badge.badge_description}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click
            onUseBadge(badge);
          }}
          variant="outline"
          className="w-full border-secondary text-secondary hover:bg-secondary hover:text-white transition-all duration-200 text-sm"
        >
          Use This Badge
        </Button>
      </CardFooter>
    </Card>
  );
}
