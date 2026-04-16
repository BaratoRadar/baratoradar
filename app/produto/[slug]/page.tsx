export const dynamic = "force-dynamic";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const p = params instanceof Promise ? await params : params;
  const slug = p.slug;

  const products = await prisma.product.findMany({
    include: {
      offers: {
        include: {
          store: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const matchingProducts = products.filter(
    (product) => slugify(product.name) === slug
  );

  if (matchingProducts.length === 0) {
    return notFound();
  }

  const productName = matchingProducts[0].name;

  const allOffers = matchingProducts
    .flatMap((product) => product.offers)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  // 🔥 Agrupar por supermercado
  const byStore: Record<string, number[]> = {};

  for (const offer of allOffers) {
    if (!byStore[offer.store.name]) {
      byStore[offer.store.name] = [];
    }
    byStore[offer.store.name].push(offer.price);
  }

  const summary = Object.entries(byStore).map(([store, prices]) => {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg =
      prices.reduce((sum, p) => sum + p, 0) / prices.length;

    return { store, min, max, avg };
  });

  const lowestMin =
    summary.length > 0 ? Math.min(...summary.map((s) => s.min)) : 0;

  const highestMin =
    summary.length > 0 ? Math.max(...summary.map((s) => s.min)) : 0;

  function getBarWidth(price: number) {
    if (summary.length <= 1 || lowestMin === highestMin) return "100%";

    const normalized =
      1 - (price - lowestMin) / (highestMin - lowestMin);

    const percent = 35 + normalized * 65; // mínimo 35%, máximo 100%
    return `${percent}%`;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">
        {productName}
      </h1>

      <p className="mt-2 text-slate-600">
        Histórico de preços por supermercado
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Ofertas encontradas: {allOffers.length}
      </p>

      {/* 🔥 BLOCO DO GRÁFICO FINAL */}
      <div className="mt-6 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">
          Comparação por supermercado
        </h2>

        <p className="mb-4 text-xs text-slate-500">
          Ranking baseado no menor preço registrado
        </p>

        <div className="space-y-4">
          {summary
            .sort((a, b) => a.min - b.min)
            .map((s, index) => {
              const medal =
                index === 0 ? "🥇" :
                index === 1 ? "🥈" :
                index === 2 ? "🥉" : "🏪";

              return (
                <div key={s.store} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-semibold text-slate-800">
                      {medal} {s.store}
                    </div>
                    <div className="font-bold text-green-700">
                      {s.min.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </div>
                  </div>

                  {/* 🔥 BARRA GARANTIDA (SEM TAILWIND) */}
                  <div
                    style={{
                      height: "16px",
                      width: "100%",
                      background: "#e5e7eb",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "16px",
                        width: getBarWidth(s.min),
                        background: "#16a34a",
                        borderRadius: "999px",
                        transition: "all 0.3s",
                      }}
                    />
                  </div>

                  <div className="text-xs text-slate-500">
                    média: {s.avg.toFixed(2)} | variação:{" "}
                    {(s.max - s.min).toFixed(2)}
                  </div>
                </div>
              );
            })}

          {summary.length === 0 && (
            <div className="text-sm text-slate-600">
              Sem dados para o gráfico.
            </div>
          )}
        </div>
      </div>

      {/* 📋 TABELA */}
      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Supermercado</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Região</th>
            </tr>
          </thead>

          <tbody>
            {allOffers.map((offer) => (
              <tr key={offer.id} className="border-t">
                <td className="px-4 py-3">
                  {new Date(offer.createdAt).toLocaleDateString("pt-BR")}
                </td>

                <td className="px-4 py-3">{offer.store.name}</td>

                <td className="px-4 py-3 font-bold text-green-700">
                  {offer.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>

                <td className="px-4 py-3">
                  {offer.region ?? "-"}
                </td>
              </tr>
            ))}

            {allOffers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-600">
                  Nenhum histórico encontrado para este produto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}