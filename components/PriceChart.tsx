"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Props = {
  data: {
    date: string;
    [key: string]: string | number;
  }[];
};

export function PriceChart({ data }: Props) {
  const supermarketKeys =
    data.length > 0
      ? Object.keys(data[0]).filter((key) => key !== "date")
      : [];

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          {supermarketKeys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}