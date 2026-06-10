import { getCart } from "./cartService.js";
import { fuzzySearchProducts } from "./symptomService.js";
import {
  INTERACTION_RULES,
  CROSS_SELL_RULES,
  containsTerm
} from "../data/drugInteractionRules.js";

const collectIngredients = (cartItems) => {
  const names = [];
  for (const item of cartItems) {
    const medicine = item.Medicine;
    if (!medicine) continue;
    if (medicine.active_ingredient) names.push(medicine.active_ingredient);
    if (medicine.name) names.push(medicine.name);
  }
  return names;
};

const detectInteractions = (ingredients) => {
  const warnings = [];

  for (const rule of INTERACTION_RULES) {
    const matched = rule.ingredients.filter((term) =>
      ingredients.some((ingredient) => containsTerm(ingredient, term))
    );

    if (matched.length >= 2) {
      warnings.push({
        severity: rule.severity,
        message: rule.message,
        matched_ingredients: matched
      });
    }
  }

  return warnings;
};

const detectCrossSell = async (ingredients) => {
  const suggestions = [];

  for (const rule of CROSS_SELL_RULES) {
    const triggered = rule.trigger.some((term) =>
      ingredients.some((ingredient) => containsTerm(ingredient, term))
    );

    if (!triggered) continue;

    const products = [];
    for (const term of rule.suggestTerms) {
      const found = await fuzzySearchProducts(term, { limit: 2 });
      for (const product of found) {
        if (!products.some((p) => p.id === product.id)) {
          products.push(product);
        }
      }
    }

    suggestions.push({
      message: rule.message,
      products: products.slice(0, 3)
    });
  }

  return suggestions;
};

const analyzeCart = async (userId) => {
  const cartItems = await getCart(userId);
  if (!cartItems?.length) {
    return { interactions: [], cross_sell: [], item_count: 0 };
  }

  const ingredients = collectIngredients(cartItems);
  const interactions = detectInteractions(ingredients);
  const cross_sell = await detectCrossSell(ingredients);

  return {
    item_count: cartItems.length,
    interactions,
    cross_sell
  };
};

export { analyzeCart };
