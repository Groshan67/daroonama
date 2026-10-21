export type DrugStatus = "active" | "transitional" | "discontinued";

export type Category = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  accent: "blue" | "teal" | "violet" | "cyan" | "amber" | "rose" | "emerald" | "indigo";
};

export type Company = {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  founded: number;
  description: string;
};

export type IngredientSeed = {
  id: string;
  name: string;
  en: string;
  categoryId: string;
  atc: string;
  description: string;
  strengths: string[];
  form: string;
  unit: string;
  pack: string;
  unitsPerPack: number;
  dailyDose: number;
  basePrice: number;
  brands: string[];
  makers: string[];
};

export type Ingredient = IngredientSeed & {
  drugCount: number;
  minPrice: number;
  maxPrice: number;
  brandCount: number;
  latestRevision: string;
};

export type CompanyStats = Company & {
  drugCount: number;
  views: number;
  minPrice: number;
  avgPrice: number;
};

export type CategoryStats = Category & {
  drugCount: number;
  ingredientCount: number;
  minPrice: number;
};

export type PricePoint = {
  date: string;
  price: number;
};

export type Revision = {
  date: string;
  from: number;
  to: number;
  change: number;
  note: string;
};

export type Drug = {
  code: string;
  name: string;
  ingredientId: string;
  ingredientName: string;
  ingredientEn: string;
  categoryId: string;
  companyId: string;
  companyName: string;
  form: string;
  strength: string;
  pack: string;
  price: number;
  prevPrice: number;
  changePct: number;
  unitPrice: number;
  monthlyCost: number;
  unitsPerPack: number;
  unit: string;
  status: DrugStatus;
  isOtc: boolean;
  isGeneric: boolean;
  views: number;
  revisionDate: string;
  revisionLabel: string;
  atc: string;
  description: string;
  history: PricePoint[];
  revisions: Revision[];
};

/** Drug without the heavy history payload, safe to pass to client components. */
export type DrugSummary = Omit<Drug, "history" | "revisions">;

export type SearchHit = {
  kind: "drug" | "ingredient" | "company" | "category";
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
};

export type SearchResults = {
  query: string;
  total: number;
  drugs: SearchHit[];
  ingredients: SearchHit[];
  companies: SearchHit[];
  categories: SearchHit[];
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  updatedAt: string;
  sections: { heading: string; body: string[] }[];
};
