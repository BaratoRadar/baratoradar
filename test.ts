import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.create({
    data: {
      name: "Produto Teste",
      price: 99.9,
    },
  });

  console.log("Produto criado:", product);
}

main()
  .catch((e) => {
    console.error("Erro:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });