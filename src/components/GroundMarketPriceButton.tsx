import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { performAgenticMarketResearch } from '../services/ai';
import { Loader2, Globe } from 'lucide-react';
import { Ingredient } from '../types';

export const GroundMarketPriceButton = ({ ingredient }: { ingredient: Ingredient }) => {
  const [isGrounding, setIsGrounding] = useState(false);
  const { updateIngredientPrice } = useDataStore();

  const handleGroundPrice = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsGrounding(true);
    try {
      const result = await performAgenticMarketResearch(ingredient.name);
      if (result && result.marketPriceCents) {
        updateIngredientPrice(ingredient.id, result.marketPriceCents, {
          marketPriceCents: result.marketPriceCents,
          groundedSummary: result.groundedSummary,
          sources: result.sources || [],
          quantity: result.quantity,
          location: result.location,
          timestamp: result.timestamp
        });
      }
    } catch (e) {
      console.error('Market price grounding failed:', e);
    } finally {
      setIsGrounding(false);
    }
  };

  return (
    <button
      className={`px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 border border-indigo-100 shadow-sm text-xs whitespace-nowrap ${isGrounding ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleGroundPrice}
      disabled={isGrounding}
    >
      {isGrounding ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
      <span>{isGrounding ? 'Grounding...' : 'Ground Market Price'}</span>
    </button>
  );
};