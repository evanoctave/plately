import { buildCoachTips, type CoachInput } from '../coach';
import { ZERO_NUTRITION, type Goals, type Nutrition } from '../../data/nutrients';

const GOALS: Goals = { calories: 2000, protein: 150, carbs: 200, fat: 60, water: 2500 };

function make(partial: Partial<Nutrition>, itemCount = 3): CoachInput {
  return { totals: { ...ZERO_NUTRITION, ...partial }, goals: GOALS, itemCount };
}

const ids = (input: CoachInput) => buildCoachTips(input).map((t) => t.id);

describe('buildCoachTips', () => {
  it('prompts to log when the day is empty', () => {
    const tips = buildCoachTips(make({}, 0));
    expect(tips).toHaveLength(1);
    expect(tips[0]?.id).toBe('empty');
  });

  it('flags a protein shortfall', () => {
    expect(ids(make({ protein: 40, calories: 800 }))).toContain('protein-low');
  });

  it('flags calories over goal', () => {
    expect(ids(make({ calories: 2400, protein: 160 }))).toContain('cal-over');
  });

  it('flags high sugar and sodium', () => {
    const got = ids(make({ sugar: 80, sodium: 3000, protein: 160, calories: 1900 }));
    expect(got).toContain('sugar-high');
    expect(got).toContain('sodium-high');
  });

  it('congratulates a dialed-in day', () => {
    const got = ids(make({ protein: 155, calories: 1950 }));
    expect(got).toContain('on-track');
  });

  it('orders warnings before positives', () => {
    const tips = buildCoachTips(make({ protein: 40, calories: 2400, sugar: 90 }));
    const tones = tips.map((t) => t.tone);
    const firstGood = tones.indexOf('good');
    const lastWarn = tones.lastIndexOf('warn');
    if (firstGood !== -1) expect(lastWarn).toBeLessThan(firstGood);
  });
});
