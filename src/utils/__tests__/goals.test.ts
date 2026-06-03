import {
  bmr,
  tdee,
  computeGoals,
  lbToKg,
  feetInchesToCm,
  type GoalInputs,
} from '../goals';

const baseMale: GoalInputs = {
  sex: 'male',
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  direction: 'maintain',
};

describe('bmr (Mifflin–St Jeor)', () => {
  it('matches the known male formula', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(bmr(baseMale)).toBeCloseTo(1780, 0);
  });

  it('applies the female offset', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(bmr({ sex: 'female', age: 25, heightCm: 165, weightKg: 60 })).toBeCloseTo(1345.25, 1);
  });
});

describe('tdee', () => {
  it('multiplies BMR by the activity factor', () => {
    expect(tdee(baseMale)).toBeCloseTo(1780 * 1.55, 0);
  });
});

describe('computeGoals', () => {
  it('produces sensible maintenance goals', () => {
    const g = computeGoals(baseMale);
    expect(g.calories).toBe(Math.round(1780 * 1.55));
    expect(g.protein).toBe(Math.round(80 * 1.6)); // 128
    expect(g.water).toBe(80 * 35); // 2800
    expect(g.carbs).toBeGreaterThan(0);
  });

  it('cuts calories when losing and bumps protein when gaining', () => {
    const lose = computeGoals({ ...baseMale, direction: 'lose' });
    const maintain = computeGoals(baseMale);
    const gain = computeGoals({ ...baseMale, direction: 'gain' });
    expect(lose.calories).toBeLessThan(maintain.calories);
    expect(gain.calories).toBeGreaterThan(maintain.calories);
    expect(gain.protein).toBe(Math.round(80 * 1.8));
  });

  it('never returns negative carbs', () => {
    const g = computeGoals({ ...baseMale, weightKg: 200, direction: 'lose', activity: 'sedentary' });
    expect(g.carbs).toBeGreaterThanOrEqual(0);
  });
});

describe('unit helpers', () => {
  it('converts pounds to kg', () => {
    expect(lbToKg(220.462)).toBeCloseTo(100, 2);
  });
  it('converts feet/inches to cm', () => {
    expect(feetInchesToCm(5, 11)).toBeCloseTo(180.34, 1);
  });
});
