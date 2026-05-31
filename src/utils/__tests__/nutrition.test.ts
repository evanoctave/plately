import { nutritionForGrams, sumNutrition, clamp01, round } from '../nutrition';
import { fmt, fmtInt } from '../format';
import { getFoodById, searchFoods, FOODS } from '../../data/foods';

describe('nutrition math', () => {
  const apple = getFoodById('apple')!;

  it('scales per-100g values to an arbitrary gram amount', () => {
    const half = nutritionForGrams(apple, 50);
    expect(half.calories).toBeCloseTo(apple.per100g.calories / 2, 1);
    expect(half.water).toBeCloseTo(apple.per100g.water / 2, 1);
  });

  it('returns the per-100g profile unchanged for 100 g', () => {
    const full = nutritionForGrams(apple, 100);
    expect(full.protein).toBeCloseTo(apple.per100g.protein, 1);
  });

  it('sums multiple nutrition profiles', () => {
    const a = nutritionForGrams(apple, 100);
    const total = sumNutrition([a, a]);
    expect(total.calories).toBeCloseTo(apple.per100g.calories * 2, 1);
  });
});

describe('helpers', () => {
  it('clamps fractions to [0,1]', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(NaN)).toBe(0);
  });

  it('rounds to one decimal', () => {
    expect(round(1.2345)).toBe(1.2);
  });

  it('formats numbers without trailing .0', () => {
    expect(fmt(5)).toBe('5');
    expect(fmt(5.25)).toBe('5.3');
    expect(fmtInt(1234)).toBe('1,234');
  });
});

describe('food database', () => {
  it('has unique ids', () => {
    const ids = new Set(FOODS.map((f) => f.id));
    expect(ids.size).toBe(FOODS.length);
  });

  it('finds foods by name and alias', () => {
    expect(searchFoods('apple')[0]?.id).toBe('apple');
    expect(searchFoods('burger')[0]?.id).toBe('hamburger');
  });

  it('every food has complete nutrition fields', () => {
    for (const food of FOODS) {
      for (const key of ['calories', 'protein', 'carbs', 'fat', 'water'] as const) {
        expect(typeof food.per100g[key]).toBe('number');
      }
    }
  });
});
