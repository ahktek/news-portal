import HomePage from "@/components/HomePage";
import { getLatestArticles } from "@/lib/articles";

export default async function Page() {
  const articles = await getLatestArticles(20);
  return <HomePage articles={articles} />;
}