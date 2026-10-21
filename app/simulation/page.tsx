import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SimulationTool } from "@/components/tools/simulation-tool";
import { getSimulationInitial } from "@/lib/catalog/simulation";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = seoMetadata({
  title: "شبیه‌سازی قیمت دارو | برآورد هزینه ماهانه و سالانه",
  description:
    "هزینه ماهانه و سالانه دارو را بر اساس قیمت بسته واقعی، تعداد بسته مصرفی و نرخ رشد سالانه برآورد کنید.",
  path: "/simulation",
  keywords: ["شبیه‌سازی قیمت دارو", "هزینه ماهانه دارو", "هزینه سالانه دارو", "برآورد هزینه دارو"],
});

type RawParams = Record<string, string | string[] | undefined>;

export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const rawCode = Array.isArray(params.drug) ? params.drug[0] : params.drug;
  const initial = getSimulationInitial(rawCode);

  return (
    <div className="page-container py-7 sm:py-9">
      <Breadcrumbs items={[{ label: "ابزارها" }, { label: "شبیه‌سازی قیمت" }]} />
      <div className="max-w-[720px]">
        <p className="eyebrow">
          <span className="h-1 w-1 rounded-full bg-teal" />
          ابزار برآورد هزینه روی داده واقعی
        </p>
        <h1 className="mt-1.5 text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
          شبیه‌سازی قیمت دارو
        </h1>
        <p className="mt-1.5 text-[12px] leading-6 text-muted">
          داروی واقعی را جستجو کنید، تعداد بسته مصرفی در ماه، افق زمانی و نرخ رشد سالانه را انتخاب
          کنید تا هزینه ماهانه و سالانه برآورد شود. مبنای قیمت، قیمت بسته =
          <span className="num"> ConsumerPrice × PackageCount </span>
          است.
        </p>
      </div>

      <div className="mt-6">
        <SimulationTool initial={initial} />
      </div>
    </div>
  );
}
