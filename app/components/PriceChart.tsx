"use client";

type Point = {
  label: string;
  store: string;
  price: number;
};

type Props = {
  data: Point[];
};

export function PriceChart({ data }: Props) {
  return (
    <div
      style={{
        border: "3px solid red",
        padding: "16px",
        background: "#fff7ed",
        borderRadius: "12px",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 12 }}>
        TESTE DO GRÁFICO — registros: {data.length}
      </div>

      {data.length === 0 ? (
        <div>Sem dados</div>
      ) : (
        data.map((item, index) => (
          <div key={`${item.store}-${index}`} style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>
              {item.label} • {item.store} • R$ {item.price.toFixed(2)}
            </div>
            <div
              style={{
                height: "18px",
                width: `${Math.max(8, item.price * 5)}px`,
                background: "green",
                borderRadius: "6px",
              }}
            />
          </div>
        ))
      )}
    </div>
  );
}