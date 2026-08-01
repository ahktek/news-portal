import type { Metadata } from "next";
import ArticleEditor from "@/components/cms/ArticleEditor";

export const metadata: Metadata = { title: "New Article — TANGENT CMS" };

export default function NewArticlePage() {
  return <ArticleEditor />;
}
