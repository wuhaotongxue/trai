/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 19:55:06
 * 描述: 管理后台答卷详情页入口
 */
import { ExamSubmissionDetailAdminPage } from "@/components/feature/exam/exam_submission_detail_admin_page";

interface AdminExamSubmissionDetailPageProps {
  params: Promise<{
    share_token: string;
    submission_id: string;
  }>;
}

/**
 * 管理后台答卷详情页入口.
 *
 * 用途:
 *     根据分享令牌和答卷 ID 渲染后台答卷详情页.
 * 参数:
 *     props.params: App Router 动态路由参数.
 * 返回值:
 *     Promise<JSX.Element>: 已发布答卷详情页.
 * 异常:
 *     无.
 */
export default async function AdminExamSubmissionDetailPage({
  params,
}: AdminExamSubmissionDetailPageProps) {
  const resolvedParams = await params;
  return (
    <ExamSubmissionDetailAdminPage
      shareToken={resolvedParams.share_token}
      submissionId={resolvedParams.submission_id}
    />
  );
}
