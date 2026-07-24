import Link from "next/link";

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  return (
    <nav className="pagination mt-8" aria-label="Pagination">
      {currentPage > 1 && (
        <Link href={`${basePath}?page=${currentPage - 1}`} className="no-underline">
          ← Prev
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
        .map((p, idx, arr) => (
          <span key={p}>
            {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-tangent-slate">…</span>}
            {p === currentPage ? (
              <span className="active">{p}</span>
            ) : (
              <Link href={`${basePath}?page=${p}`} className="no-underline">{p}</Link>
            )}
          </span>
        ))}
      {currentPage < totalPages && (
        <Link href={`${basePath}?page=${currentPage + 1}`} className="no-underline">
          Next →
        </Link>
      )}
    </nav>
  );
}