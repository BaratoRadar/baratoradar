import Header from "../components/Header";


export const metadata = {
  title: "BaratoRadar",
  description: "O radar das melhores ofertas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-slate-900">
        <Header />
        {children}
      </body>
    </html>
  );
}