import { getCatalogProduct, searchCatalog } from "./queries";
import type { CatalogProduct } from "./types";
import { formatDose, productTypeLabel } from "@/lib/format";

export type SimulationDrug = {
  code: string;
  name: string;
  ingredientName: string;
  companyName: string;
  strength: string;
  price: number;
  unitsPerPack: number;
  unit: string;
  pack: string;
  categoryName: string;
};

export function toSimulationDrug(product: CatalogProduct): SimulationDrug | null {
  if (product.priceToman === null || !product.packageCount || product.packageCount <= 0) return null;
  return {
    code: product.canonicalIrc,
    name: product.displayName,
    ingredientName: product.ingredientNameFa ?? "—",
    companyName: product.brandOwnerName ?? "—",
    strength: [formatDose(product.dose), product.dosageFormFa].filter(Boolean).join(" · "),
    price: product.priceToman,
    unitsPerPack: product.packageCount,
    unit: product.dosageFormFa ?? "واحد",
    pack: `بسته ${product.packageCount.toLocaleString("fa-IR")}`,
    categoryName: product.categoryName ?? productTypeLabel(product.productType),
  };
}

export function searchSimulationProducts(query: string, limit = 10): SimulationDrug[] {
  return searchCatalog({
    q: query,
    priced: "1",
    perPage: Math.max(5, Math.min(20, limit)),
    sort: "name",
  })
    .rows.map(toSimulationDrug)
    .filter((item): item is SimulationDrug => item !== null);
}

export function getSimulationInitial(code?: string): SimulationDrug | null {
  if (code) {
    const detail = getCatalogProduct(code);
    if (detail) {
      const mapped = toSimulationDrug(detail.product);
      if (mapped) return mapped;
    }
  }
  return searchSimulationProducts("", 10)[0] ?? null;
}
