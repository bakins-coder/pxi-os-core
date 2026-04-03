import { describe, it, expect } from 'vitest';
import { getIndustryTerminology } from '../utils/terminology';

describe('Industry Terminology Resolution', () => {
    it('should resolve Catering terminology correctly', () => {
        const terms = getIndustryTerminology('Catering');
        expect(terms.orderTitle).toBe('Custom Order');
        expect(terms.unitsLabel).toBe('Guest Count');
        expect(terms.event_pipeline).toBe('EVENT PIPELINE');
        expect(terms.categories).toContain("Starters");
        expect(terms.categories).not.toContain("Wedding Cakes");
    });

    it('should resolve Bakery terminology correctly', () => {
        const terms = getIndustryTerminology('Bakery');
        expect(terms.orderTitle).toBe('Cake Order');
        expect(terms.unitsLabel).toBe('Portions');
        expect(terms.event_pipeline).toBe('ORDER PIPELINE');
        expect(terms.categories).toContain("Wedding Cakes");
        expect(terms.categories).not.toContain("Starters");
    });

    it('should resolve Cake industry to Bakery terminology', () => {
        const terms = getIndustryTerminology('Cake');
        expect(terms.type).toBe('Bakery');
    });

    it('should resolve Hospitality to Catering terminology', () => {
        const terms = getIndustryTerminology('Hospitality');
        expect(terms.type).toBe('Catering');
    });
});
