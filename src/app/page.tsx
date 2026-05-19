import { getCatalog } from "@/lib/catalog";
import OrderForm from "@/components/OrderForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalog();
  return <OrderForm catalog={catalog} />;
}
