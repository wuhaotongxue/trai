/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 20:20:00
 * 描述: Public exam share route page that renders the shared answer client
 */
import { ExamShareClient } from "@/components/feature/exam/exam_share_client";

interface ExamSharePageProps {
  params: Promise<{
    share_token: string;
  }>;
}

/**
 * Public exam share page entry.
 * @param props - Route params containing the share token.
 * @returns Shared exam page.
 */
export default async function ExamSharePage({ params }: ExamSharePageProps) {
  const { share_token: shareToken } = await params;

  return <ExamShareClient shareToken={shareToken} />;
}
