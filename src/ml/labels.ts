// =============================================================================
// ml/labels — Classifier label space + display mapping
// =============================================================================
// FOOD101_LABELS lists the 101 classes the on-device TFLite model can output,
// in the exact order the model produces them — index `i` of the output tensor
// corresponds to label `FOOD101_LABELS[i]`. If a new model with a different
// class order is loaded, this array MUST be reordered to match, or every
// prediction will be mislabeled.
//
// LABEL_TO_FOOD_ID maps each class label to a food id in `data/foods.json`,
// which is what the diary actually stores. Labels with no good match in the
// catalog map to `null` (the UI falls back to manual search in that case).
//
// `prettyLabel` is a tiny helper that turns `chicken_quesadilla` into
// `Chicken Quesadilla` for display.

export const FOOD101_LABELS: string[] = [
  'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
  'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
  'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
  'ceviche', 'cheesecake', 'cheese_plate', 'chicken_curry', 'chicken_quesadilla',
  'chicken_wings', 'chocolate_cake', 'chocolate_mousse', 'churros', 'clam_chowder',
  'club_sandwich', 'crab_cakes', 'creme_brulee', 'croque_madame', 'cup_cakes',
  'deviled_eggs', 'donuts', 'dumplings', 'edamame', 'eggs_benedict',
  'escargots', 'falafel', 'filet_mignon', 'fish_and_chips', 'foie_gras',
  'french_fries', 'french_onion_soup', 'french_toast', 'fried_calamari', 'fried_rice',
  'frozen_yogurt', 'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
  'grilled_salmon', 'guacamole', 'gyoza', 'hamburger', 'hot_and_sour_soup',
  'hot_dog', 'huevos_rancheros', 'hummus', 'ice_cream', 'lasagna',
  'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons', 'miso_soup',
  'mussels', 'nachos', 'omelette', 'onion_rings', 'oysters',
  'pad_thai', 'paella', 'pancakes', 'panna_cotta', 'peking_duck',
  'pho', 'pizza', 'pork_chop', 'poutine', 'prime_rib',
  'pulled_pork_sandwich', 'ramen', 'ravioli', 'red_velvet_cake', 'risotto',
  'samosa', 'sashimi', 'scallops', 'seaweed_salad', 'shrimp_and_grits',
  'spaghetti_bolognese', 'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake',
  'sushi', 'tacos', 'takoyaki', 'tiramisu', 'tuna_tartare', 'waffles',
];

// Model class → curated food id (when a match exists).
export const LABEL_TO_FOOD_ID: Record<string, string> = {
  apple_pie: 'apple_pie',
  breakfast_burrito: 'burrito',
  caesar_salad: 'caesar_salad',
  chicken_curry: 'chicken_breast',
  chicken_quesadilla: 'taco',
  chicken_wings: 'chicken_breast',
  chocolate_cake: 'chocolate_cake',
  deviled_eggs: 'egg',
  donuts: 'donut',
  dumplings: 'dumplings',
  filet_mignon: 'steak',
  french_fries: 'french_fries',
  fried_rice: 'fried_rice',
  frozen_yogurt: 'greek_yogurt',
  greek_salad: 'caesar_salad',
  grilled_cheese_sandwich: 'cheddar_cheese',
  grilled_salmon: 'salmon',
  guacamole: 'avocado',
  gyoza: 'dumplings',
  hamburger: 'hamburger',
  hot_dog: 'hot_dog',
  ice_cream: 'ice_cream',
  macaroni_and_cheese: 'mac_and_cheese',
  omelette: 'omelette',
  pancakes: 'pancakes',
  pizza: 'pizza',
  prime_rib: 'steak',
  ramen: 'ramen',
  sashimi: 'sushi',
  spaghetti_bolognese: 'spaghetti',
  spaghetti_carbonara: 'spaghetti',
  steak: 'steak',
  sushi: 'sushi',
  tacos: 'taco',
  waffles: 'pancakes',
};

// "french_fries" → "French Fries".
export function prettyLabel(label: string): string {
  return label
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
