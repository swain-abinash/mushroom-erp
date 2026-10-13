// Static homepage copy, kept apart from the layout so it can be edited without touching JSX.

export const HIGHLIGHTS = [
  { value: "5:00 AM", label: "Harvested every morning" },
  { value: "< 4 hrs", label: "From farm to your door" },
  { value: "0", label: "Pesticides or chemicals" },
  { value: "100%", label: "Substrate composted back to farms" },
];

export const VARIETIES = [
  {
    name: "Blue Oyster",
    tone: "from-slate-500/30 to-slate-700/10",
    description: "Velvety grey-blue caps with a mild, slightly nutty flavour.",
    bestFor: "Stir-fries, pasta, pan-roasting",
  },
  {
    name: "Pink Oyster",
    tone: "from-pink-400/40 to-pink-600/10",
    description: "Striking coral-pink clusters with a savoury, almost meaty bite.",
    bestFor: "Tacos, grills, crispy fries",
  },
  {
    name: "King Oyster",
    tone: "from-amber-200/60 to-amber-500/10",
    description: "Thick, firm stems that hold their shape and soak up flavour.",
    bestFor: "Scallop-style searing, BBQ",
  },
  {
    name: "White Milky",
    tone: "from-stone-100 to-stone-300/40",
    description: "Large, sturdy, long-lasting mushrooms suited to Indian cooking.",
    bestFor: "Curries, biryani, masala",
  },
  {
    name: "Paddy Straw",
    tone: "from-yellow-700/30 to-yellow-900/10",
    description: "Delicate, tender buttons prized in South and East Asian dishes.",
    bestFor: "Soups, stir-fries, gravies",
  },
  {
    name: "Dry & Powder",
    tone: "from-orange-800/30 to-orange-950/10",
    description: "Sun-dried mushrooms and fine powders with a long shelf life.",
    bestFor: "Soups, seasoning, smoothies",
  },
];

export const STEPS = [
  {
    icon: "🌾",
    title: "Grown on clean straw",
    body: "Pasteurized straw beds in climate-controlled rooms — no soil, no chemicals.",
  },
  {
    icon: "🌅",
    title: "Hand-picked at dawn",
    body: "Every batch is harvested at 5:00 AM, when mushrooms are firm and fresh.",
  },
  {
    icon: "📦",
    title: "Graded & packed",
    body: "Sorted by quality and packed in breathable, food-grade packaging.",
  },
  {
    icon: "🛵",
    title: "Delivered the same day",
    body: "Morning and evening dispatch slots get them to your kitchen within hours.",
  },
];

export const FARM_POINTS = [
  "Climate-controlled incubation and fruiting rooms",
  "Pasteurized paddy straw substrate — never chemically treated",
  "Hygienic handling from harvest to packing",
  "Every batch tracked from spawn to sale",
];

export const NUTRITION = [
  { icon: "💪", title: "Plant protein", body: "A satisfying, meaty texture with useful plant protein." },
  { icon: "☀️", title: "Vitamin D & B", body: "A natural source of B-vitamins, and vitamin D when sun-exposed." },
  { icon: "🥗", title: "Light & filling", body: "Low in calories and fat, high in fibre." },
  { icon: "🛡️", title: "Antioxidants", body: "Rich in natural antioxidants such as ergothioneine." },
];

export const RECIPES = [
  {
    title: "Garlic butter oyster mushrooms",
    time: "15 min",
    body: "Tear oyster mushrooms by hand, sear in a hot pan until golden, then finish with butter, garlic and parsley.",
  },
  {
    title: "Mushroom pepper fry",
    time: "20 min",
    body: "Toss milky mushroom slices with onion, curry leaves and crushed black pepper for a classic South Indian side.",
  },
  {
    title: "Creamy mushroom soup",
    time: "30 min",
    body: "Simmer mixed mushrooms with onion and stock, blend smooth and finish with cream and a pinch of mushroom powder.",
  },
];

export const BUSINESS_POINTS = [
  { title: "Tiered B2B pricing", body: "Restaurant and wholesale rates that drop as your order grows." },
  { title: "Reliable morning delivery", body: "Fresh stock in your kitchen before service, every day." },
  { title: "Consistent grading", body: "Uniform size and quality, sorted for professional kitchens." },
  { title: "GST invoices", body: "Add your GSTIN to your account for proper tax invoices." },
];

export function faqs(serviceArea: string) {
  return [
    {
      question: "How fresh are your mushrooms?",
      answer:
        "We harvest every morning at 5:00 AM and dispatch the same day, so mushrooms usually reach you within hours of being picked.",
    },
    {
      question: "Where do you deliver?",
      answer: serviceArea
        ? `We currently deliver across ${serviceArea}. You can confirm your PIN code at checkout.`
        : "We deliver locally around our farm. You can confirm your PIN code at checkout.",
    },
    {
      question: "How should I store fresh mushrooms?",
      answer:
        "Keep them in a paper bag in the fridge (around 4°C) and avoid plastic, which traps moisture. Most fresh varieties are best within 2–3 days.",
    },
    {
      question: "Do you sell to restaurants and retailers?",
      answer:
        "Yes. Create an account, add your business name and GSTIN in your profile, and you'll get access to restaurant and wholesale pricing with morning delivery.",
    },
    {
      question: "Which payment methods will you accept?",
      answer: "UPI, debit and credit cards, net banking and cash on delivery.",
    },
    {
      question: "What if a variety is sold out?",
      answer:
        "Harvests sell out quickly. Open the product and tap “Notify me” — we'll email you as soon as the next harvest is in stock.",
    },
  ];
}
