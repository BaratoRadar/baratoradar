export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SP = {
  cidade?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SP> | SP;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const cidade = (sp?.cidade ?? "").trim();

  const offers = await prisma.offer.findMany({
    where: cidade
      ? {
          city: {
            equals: cidade,
            mode: "insensitive",
          },
        }
      : {},
    include: {
      product: true,
      store: true,
    },
    orderBy: { price: "asc" },
    take: 8,
  });

  const cestaProducts = await prisma.product.findMany({
    where: {
      OR: [
        { category: "Cesta Básica" },
        { category: "Cesta básica" },
        { category: "cesta básica" },
      ],
    },
    include: {
      offers: {
        where: cidade
          ? {
              city: {
                equals: cidade,
                mode: "insensitive",
              },
            }
          : {},
        include: {
          store: true,
        },
      },
    },
  });

  const storeTotals: Record<string, number> = {};

  for (const product of cestaProducts) {
    const bestByStore: Record<string, number> = {};

    for (const offer of product.offers) {
      const store = offer.store.name;

      if (!bestByStore[store] || offer.price < bestByStore[store]) {
        bestByStore[store] = offer.price;
      }
    }

    for (const [store, price] of Object.entries(bestByStore)) {
      if (!storeTotals[store]) {
        storeTotals[store] = 0;
      }
      storeTotals[store] += price;
    }
  }

  const rankingCidade = Object.entries(storeTotals)
    .map(([store, total]) => ({ store, total }))
    .sort((a, b) => a.total - b.total);

  const maisBaratoCidade = rankingCidade[0] ?? null;

  const regionStoreTotals: Record<string, Record<string, number>> = {};

  for (const product of cestaProducts) {
    const bestByRegionStore: Record<string, Record<string, number>> = {};

    for (const offer of product.offers) {
      if (!offer.region) continue;

      const region = offer.region;
      const store = offer.store.name;

      if (!bestByRegionStore[region]) {
        bestByRegionStore[region] = {};
      }

      if (
        !bestByRegionStore[region][store] ||
        offer.price < bestByRegionStore[region][store]
      ) {
        bestByRegionStore[region][store] = offer.price;
      }
    }

    for (const [region, stores] of Object.entries(bestByRegionStore)) {
      if (!regionStoreTotals[region]) {
        regionStoreTotals[region] = {};
      }

      for (const [store, price] of Object.entries(stores)) {
        if (!regionStoreTotals[region][store]) {
          regionStoreTotals[region][store] = 0;
        }
        regionStoreTotals[region][store] += price;
      }
    }
  }

  const rankingPorRegiao = Object.entries(regionStoreTotals)
    .map(([region, stores]) => {
      const ranking = Object.entries(stores)
        .map(([store, total]) => ({ store, total }))
        .sort((a, b) => a.total - b.total);

      return {
        region,
        winner: ranking[0] ?? null,
      };
    })
    .filter((item) => item.winner);

  const melhorOferta = offers[0] ?? null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-3xl border bg-gradient-to-br from-green-50 to-white p-8 shadow-sm">
        <h1 className="text-4xl font-extrabold text-slate-900">
          BaratoRadar
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Compare preços de supermercados e acompanhe as melhores ofertas,
          a cesta básica mais barata e os destaques por cidade e região.
        </p>

        <form method="get" className="mt-6 flex flex-wrap gap-3">
          <select
            name="cidade"
            defaultValue={cidade}
            className="rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700"
          >
            <option value="">Todas as cidades</option>
            <option value="Porto Alegre">Porto Alegre</option>
            <option value="Canoas">Canoas</option>
            <option value="Novo Hamburgo">Novo Hamburgo</option>
            <option value="São Leopoldo">São Leopoldo</option>
            <option value="Gravataí">Gravataí</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            Filtrar cidade
          </button>

          <a
            href="/"
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpar
          </a>
        </form>

        <div className="mt-4 text-xs text-slate-500">
          Cidade selecionada: {cidade || "Todas"}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/ofertas"
            className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
          >
            Ver ofertas
          </Link>

          <Link
            href="/cesta-basica-ranking"
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ranking da cesta
          </Link>

          <Link
            href="/cesta-basica-regiao"
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ranking por região
          </Link>
        </div>
      </section>

      {maisBaratoCidade && (
        <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold text-orange-600">
            🥇 MAIS BARATO {cidade ? `EM ${cidade.toUpperCase()}` : "DA CIDADE"}
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {maisBaratoCidade.store}
          </div>

          <div className="mt-3 text-3xl font-extrabold text-green-700">
            {maisBaratoCidade.total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Menor valor da cesta básica entre os supermercados cadastrados.
          </p>
        </section>
      )}

      {melhorOferta && (
        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold text-orange-600">
            🔥 MELHOR OFERTA DO DIA
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {melhorOferta.product.name}
          </div>

          <div className="mt-1 text-sm text-slate-600">
            {melhorOferta.store.name} • {melhorOferta.city ?? "Sem cidade"} •{" "}
            {melhorOferta.region ?? "Sem região"}
          </div>

          <div className="mt-3 text-3xl font-extrabold text-green-700">
            {melhorOferta.price.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            📍 Mais barato por região
          </h2>

          <Link
            href="/cesta-basica-regiao"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Ver completo
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rankingPorRegiao.map((item) => (
            <div
              key={item.region}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-semibold text-slate-500">
                {item.region}
              </div>

              <div className="mt-2 text-lg font-bold text-slate-900">
                {item.winner?.store}
              </div>

              <div className="mt-2 text-2xl font-extrabold text-green-700">
                {item.winner?.total.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          ))}

          {rankingPorRegiao.length === 0 && (
            <div className="rounded-2xl border bg-white p-5 text-slate-600 shadow-sm">
              Ainda não há dados suficientes por região.
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            Melhores ofertas
          </h2>

          <Link
            href="/ofertas"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            Ver todas
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {offers.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="text-xs font-semibold text-slate-500">
                {o.product.category ?? "Oferta"}
              </div>

              <div className="mt-1 text-lg font-bold text-slate-900">
                {o.product.name}
              </div>

              <div className="mt-1 text-sm text-slate-600">
                {o.store.name} • {o.city ?? "Sem cidade"} •{" "}
                {o.region ?? "Sem região"}
              </div>

              <div className="mt-3 text-2xl font-extrabold text-green-700">
                {o.price.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-slate-900">Categorias</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Link
            href="/proteinas"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <div className="text-2xl">🥩</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Proteínas
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Frango, ovos, carne bovina e mais.
            </p>
          </Link>

          <Link
            href="/cesta-basica"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <div className="text-2xl">🧺</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Cesta básica
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Arroz, feijão, café, erva-mate e macarrão.
            </p>
          </Link>

          <Link
            href="/limpeza"
            className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <div className="text-2xl">🧴</div>
            <div className="mt-3 text-lg font-bold text-slate-900">
              Limpeza
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Sabão, detergente, água sanitária e desinfetante.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}