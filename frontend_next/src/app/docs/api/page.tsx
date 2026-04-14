export default function ApiDocsPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5666/api";
  const backendOrigin = apiBase.replace(/\/api\/?$/, "");
  const docsUrl = `${backendOrigin}/docs`;

  return (
    <div className="fixed inset-0 bg-background">
      <iframe title="TRAI API Docs" src={docsUrl} className="w-full h-full border-0" />
    </div>
  );
}
