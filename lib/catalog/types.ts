export type CatalogProduct = {
  identityId: number;
  irc: string;
  canonicalIrc: string;
  isCurrent: boolean;
  aliasesCount: number;
  gtin: string | null;
  genericCode: string | null;
  genericNameEn: string | null;
  genericNameFa: string | null;
  ingredientKey: string | null;
  ingredientNameFa: string | null;
  ingredientNameEn: string | null;
  brandName: string | null;
  displayName: string;
  brandOwnerName: string | null;
  brandOwnerNationalId: string | null;
  producerName: string | null;
  producerCountry: string | null;
  dosageFormFa: string | null;
  dosageFormEn: string | null;
  routeFa: string | null;
  routeEn: string | null;
  drugIndexId: string | null;
  drugIndexFa: string | null;
  drugIndexEn: string | null;
  dose: string | null;
  packageCount: number | null;
  consumerPriceRial: number | null;
  consumerPriceToman: number | null;
  packagePriceRial: number | null;
  packagePriceToman: number | null;
  unitPriceRial: number | null;
  unitPriceToman: number | null;
  /** Package price aliases used by the shared cards. */
  priceRial: number | null;
  priceToman: number | null;
  priceMissingLatest: boolean;
  priceLastSeenAt: string | null;
  productType: string | null;
  atc: string | null;
  categoryId: string | null;
  categoryName: string | null;
  issuanceDate: string | null;
  expirationDate: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type CatalogHistoryPoint = {
  observedAt: string;
  irc: string;
  consumerPriceRial: number | null;
  consumerPriceToman: number;
  packagePriceRial: number | null;
  packagePriceToman: number | null;
  unitPriceRial: number | null;
  unitPriceToman: number;
  priceRial: number | null;
  priceToman: number | null;
  batchId: number;
};

export type CatalogAlias = {
  irc: string;
  isCurrent: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type CatalogProductDetail = {
  product: CatalogProduct;
  requestedIrc: string;
  isArchived: boolean;
  history: CatalogHistoryPoint[];
  alternatives: CatalogProduct[];
  aliases: CatalogAlias[];
};

export type CatalogSummary = {
  total: number;
  records: number;
  aliases: number;
  priced: number;
  noPrice: number;
  supplements: number;
  ingredients: number;
  companies: number;
  categories: number;
  atcNodes: number;
  batches: number;
  lastSeen: string | null;
  lastImportAt: string | null;
  lastFileName: string | null;
};

export type CatalogCategory = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  accent: string;
  count: number;
  ingredients: number;
  minPrice: number | null;
};

export type CatalogIngredient = {
  key: string;
  name: string;
  nameEn: string | null;
  count: number;
  brands: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export type CatalogIngredientDetail = {
  key: string;
  name: string;
  nameEn: string | null;
  products: CatalogProduct[];
  history: {
    irc: string;
    name: string;
    points: { observedAt: string; packagePriceToman: number }[];
  }[];
  stats: {
    count: number;
    brandOwners: number;
    producers: number;
    genericCodes: number;
    drugIndexes: number;
    branded: number;
    unbranded: number;
    minPrice: number | null;
    maxPrice: number | null;
    minUnitPrice: number | null;
    maxUnitPrice: number | null;
    categories: string[];
    firstSeen: string | null;
    lastSeen: string | null;
  };
};

export type CatalogCompany = {
  id: string;
  name: string;
  count: number;
  producerCount: number;
  genericCodes: number;
  pricedCount: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export type CatalogCompanyDetail = {
  id: string;
  name: string;
  ownerProducts: CatalogProduct[];
  producedProducts: CatalogProduct[];
  stats: {
    total: number;
    ingredients: number;
    genericCodes: number;
    priced: number;
    noPrice: number;
    minPrice: number | null;
    maxPrice: number | null;
  };
};

export type CatalogCategorySummary = {
  code: string;
  name: string;
  nameEn: string;
  rootCode: string;
  rootName: string;
  count: number;
  ingredients: number;
  minPrice: number | null;
  maxPrice: number | null;
};

export type CatalogCategoryDetail = CatalogCategorySummary & {
  products: CatalogProduct[];
};

export type ClassificationGroup = {
  code: string;
  name: string;
  nameEn: string;
  categories: CatalogCategorySummary[];
};

export type CatalogHome = {
  summary: CatalogSummary;
  categories: CatalogCategory[];
  ingredients: CatalogIngredient[];
  companies: CatalogCompany[];
  topPriced: CatalogProduct[];
  topCheap: CatalogProduct[];
  priceChanges: {
    product: CatalogProduct;
    previous: number;
    current: number;
    changePct: number;
  }[];
};

export type MarketPrice = {
  id: number;
  source: string;
  sourceProductId: string;
  sourceUrl: string | null;
  matchedIrc: string;
  matchScore: number;
  matchConfidence: string;
  priceToman: number;
  originalPriceToman: number | null;
  discountPercent: number | null;
  packageCount: number | null;
  unitPriceToman: number | null;
  rawName: string | null;
  rawBrand: string | null;
  rawCompany: string | null;
  fetchedAt: string;
};

export type DrugIndexIngredient = {
  id: number;
  substanceId: number | null;
  substanceName: string | null;
  casNumber: string | null;
  pubchemCid: number | null;
  strength: number | null;
  strengthUnitEn: string | null;
  molecule: string | null;
};

export type DrugIndexRecord = {
  id: number;
  enName: string | null;
  faName: string | null;
  dosageFormTitle: string | null;
  strength: string | null;
  routeTitle: string | null;
  atcCode: string | null;
  commissionDate: string | null;
  persianCommissionDate: string | null;
  canceled: boolean;
  cancellationDate: string | null;
  persianCancellationDate: string | null;
  accessLevel: string | null;
  drugType: string | null;
  narcoticGrade: string | null;
  ingredients: DrugIndexIngredient[];
};

export type CatalogSearchParams = {
  q?: string;
  category?: string;
  company?: string;
  productType?: string;
  priced?: string;
  form?: string;
  min?: number;
  max?: number;
  page?: number;
  perPage?: number;
  sort?: string;
};

export type CatalogSearchResult = {
  rows: CatalogProduct[];
  total: number;
  page: number;
  pages: number;
};
