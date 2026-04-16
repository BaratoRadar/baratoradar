export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

const CESTA_BASICA = [
  "Arroz 5kg",
  "Feijão preto 1kg",
  "Macarrão espaguete 500g",
  "Erva-mate 1kg",
  "Café 500g",
  "Peito de frango",
];

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

type Params = {
  slug: string;
};

export default async function SupermercadoPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const p = params instanceof Promise ? await params : params;
  const slug = p.slug;

  const stores = await prisma.store.findMany({
    include: {
      offers: {
        include: {
          product: true,
        },
        orderBy: {
          price: "asc",
        },
      },
    },
  });

  const store = stores.find((s) => slugify(s.name) === slug);

  if (!store) {
    notFound();
  }

  const cestaItems = store.offers.filter((offer) =>
    CESTA_BASICA.includes(offer.product.name)
  );

  const totalCesta = cestaItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {store.name}
        </h1>

        <p className="mt-2 text-slate-600">{store.city}</p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <div className="text-sm text-slate-600">Total da cesta básica</div>
          <div className="mt-1 text-3xl font-extrabold text-green-700">
            {totalCesta.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Região</th>
            </tr>
          </thead>
          <tbody>
            {store.offers.map((offer) => (
              <tr key={offer.id} className="border-t">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {offer.product.name}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {offer.product.category ?? "-"}
                </td>
                <td className="px-4 py-3 font-bold text-green-700">
                  {offer.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {offer.region ?? "-"}
                </td>
              </tr>
            ))}

            {store.offers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-slate-600">
                  Nenhuma oferta encontrada para este supermercado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}