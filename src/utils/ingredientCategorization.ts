/**
 * Intelligent ingredient categorization utility.
 * Infers appropriate category (Proteins, Produce, Dairy, Spices, Beverages, Dry Goods)
 * based on item name keywords.
 */

export const inferIngredientCategory = (name?: string, fallback: string = 'Dry Goods'): string => {
  if (!name || typeof name !== 'string') return fallback;
  const n = name.toLowerCase().trim();

  // 1. PROTEINS (Seafood, Poultry, Meats, Mollusks/Snails, Eggs, Organ meats)
  const proteinKeywords = [
    'snail', 'snails', 'igbin', 'chicken', 'beef', 'turkey', 'pork', 'lamb', 'mutton',
    'goat', 'ram', 'cow', 'meat', 'fish', 'croaker', 'tilapia', 'catfish', 'salmon',
    'tuna', 'prawn', 'prawns', 'shrimp', 'shrimps', 'crab', 'lobster', 'seafood',
    'egg', 'eggs', 'suya', 'ponmo', 'kpomo', 'cowleg', 'shaki', 'tripe', 'abodi',
    'gizzard', 'liver', 'kidney', 'sausage', 'bacon', 'ham', 'stockfish', 'crayfish',
    'kwanta', 'tofu', 'beefburger', 'patty', 'hotdog'
  ];
  if (proteinKeywords.some(k => n.includes(k))) return 'Proteins';

  // 2. PRODUCE (Fresh vegetables, fruits, tubers, herbs)
  const produceKeywords = [
    'pepper', 'tomato', 'tomatoes', 'onion', 'onions', 'garlic', 'ginger', 'lettuce',
    'cabbage', 'carrot', 'carrots', 'spinach', 'ugu', 'ewedu', 'okra', 'okro', 'potato',
    'potatoes', 'yam', 'plantain', 'cassava', 'cucumber', 'banana', 'apple', 'orange',
    'lemon', 'lime', 'pineapple', 'mango', 'watermelon', 'berry', 'strawberry',
    'avocado', 'beetroot', 'broccoli', 'cauliflower', 'celery', 'parsley', 'mint',
    'scallion', 'leek', 'zucchini', 'mushroom', 'habanero', 'tatashe', 'rodo', 'sombo'
  ];
  if (produceKeywords.some(k => n.includes(k))) return 'Produce';

  // 3. DAIRY (Milk, cheese, butter, cream, etc.)
  const dairyKeywords = [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'curd', 'margarine',
    'ghee', 'whipping cream', 'condensed milk', 'evaporated milk'
  ];
  if (dairyKeywords.some(k => n.includes(k))) return 'Dairy';

  // 4. SPICES & SEASONINGS
  const spiceKeywords = [
    'spice', 'spices', 'salt', 'curry', 'thyme', 'nutmeg', 'seasoning', 'maggi',
    'knorr', 'royco', 'pepper soup spice', 'suya spice', 'rosemary', 'oregano',
    'cinnamon', 'paprika', 'clove', 'cloves', 'bay leaf', 'bay leaves', 'vanilla',
    'cardamom', 'turmeric', 'ginger powder', 'garlic powder', 'baking powder',
    'baking soda', 'yeast', 'bullion', 'bouillon'
  ];
  if (spiceKeywords.some(k => n.includes(k))) return 'Spices';

  // 5. BEVERAGES
  const beverageKeywords = [
    'water', 'juice', 'soda', 'wine', 'beer', 'drink', 'tea', 'coffee', 'zobo',
    'kunu', 'malt', 'coca-cola', 'pepsi', 'sprite', 'fanta', 'chapman', 'syrup'
  ];
  if (beverageKeywords.some(k => n.includes(k))) return 'Beverages';

  // 6. DRY GOODS (Grains, legumes, flours, oils, pasta, sugar)
  const dryGoodsKeywords = [
    'rice', 'beans', 'flour', 'sugar', 'oil', 'spaghetti', 'pasta', 'macaroni',
    'semolina', 'semo', 'garri', 'gari', 'wheat', 'oat', 'oats', 'noodle', 'noodles',
    'indomie', 'cereal', 'cornstarch', 'starch', 'cuscus', 'couscous', 'quinoa'
  ];
  if (dryGoodsKeywords.some(k => n.includes(k))) return 'Dry Goods';

  return fallback;
};
