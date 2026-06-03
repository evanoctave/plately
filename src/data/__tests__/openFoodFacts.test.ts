import { lookupBarcode, mapProductToFood, OFF_PREFIX } from '../openFoodFacts';

describe('mapProductToFood', () => {
  it('maps energy/macros and converts micro units', () => {
    const food = mapProductToFood('123', {
      product_name: 'Test Bar',
      brands: 'Acme, Other',
      serving_quantity: 40,
      nutriments: {
        'energy-kcal_100g': 400,
        proteins_100g: 20,
        carbohydrates_100g: 50,
        fat_100g: 10,
        fiber_100g: 5,
        sugars_100g: 30,
        sodium_100g: 0.5, // g → 500 mg
        'vitamin-c_100g': 0.06, // g → 60 mg
      },
    });
    expect(food).not.toBeNull();
    expect(food!.id).toBe(`${OFF_PREFIX}123`);
    expect(food!.name).toBe('Test Bar (Acme)');
    expect(food!.servingGrams).toBe(40);
    expect(food!.per100g.calories).toBe(400);
    expect(food!.per100g.sodium).toBeCloseTo(500, 1);
    expect(food!.per100g.vitaminC).toBeCloseTo(60, 1);
  });

  it('derives sodium from salt when sodium is absent', () => {
    const food = mapProductToFood('1', {
      product_name: 'Salty',
      nutriments: { 'energy-kcal_100g': 100, salt_100g: 2.5 }, // → 1 g sodium → 1000 mg
    });
    expect(food!.per100g.sodium).toBeCloseTo(1000, 0);
  });

  it('defaults serving to 100 g when missing', () => {
    const food = mapProductToFood('2', {
      product_name: 'NoServing',
      nutriments: { 'energy-kcal_100g': 50 },
    });
    expect(food!.servingGrams).toBe(100);
  });

  it('returns null without a name', () => {
    expect(mapProductToFood('3', { nutriments: { 'energy-kcal_100g': 100 } })).toBeNull();
  });

  it('returns null with no usable nutrition', () => {
    expect(mapProductToFood('4', { product_name: 'Empty', nutriments: {} })).toBeNull();
  });
});

describe('lookupBarcode input validation', () => {
  it('rejects malformed barcodes without hitting the network', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('network should not be called'));
    for (const bad of ['', '123', 'abc', '1'.repeat(20), 'DROP TABLE']) {
      await expect(lookupBarcode(bad)).resolves.toEqual({ status: 'not_found' });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
