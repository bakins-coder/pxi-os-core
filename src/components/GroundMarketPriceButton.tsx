import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { performAgenticMarketResearch } from '../services/ai';
import { Loader2, Globe } from 'lucide-react';

export const GroundMarketPriceButton = ({ ingredient }) => {
  const [isGrounding, setIsGrounding] = useState(false);
  const { updateIngredientPrice } = useDataStore();

  const handleGroundPrice = async (e) => {
    e.stopPropagation();
    setIsGrounding(true);
    try {
      const result = await performAgenticMarketResearch(ingredient.name);
      updateIngredientPrice(ingredient.id, result.marketPriceCents, {
        marketPriceCents: result.marketPriceCents,
        groundedSummary: result.groundedSummary,
        sources: result.sources || []
      });
    } catch (e) {
      console.error('Market price grounding failed:', e);
    } finally {
      setIsGrounding(false);
    }
  };

  return (
    <button
      className={`p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 ${isGrounding ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleGroundPrice}
      disabled={isGrounding}
    >
      {isGrounding ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
      {isGrounding ? 'Grounding...' : 'Ground Market Price'}
    </button>
  );
};