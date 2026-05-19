import { PRODUCTS, OFFERS } from "@/data/products";
import { PRODUCT_INFO } from "@/data/productInfo";
import OrderForm from "@/components/OrderForm";

export default function Home() {
  return <OrderForm catalog={{ products: PRODUCTS, offers: OFFERS, productInfo: PRODUCT_INFO }} />;
}
