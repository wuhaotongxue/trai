/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 19:42:07
 * 描述: 管理后台已发布考试详情页入口
 */
import { ExamPublishDetailAdminPage } from "@/components/feature/exam/exam_publish_detail_admin_page";

interface AdminExamPublishDetailPageProps {
  params: Promise<{
    share_token: string;
  }>;
}

/**
 * 管理后台已发布考试详情页入口.
 *
 * 用途:
 *     根据分享令牌渲染已发布考试详情页.
 * 参数:
 *     props.params: App Router 动态路由参数.
 * 返回值:
 *     Promise<JSX.Element>: 已发布考试详情页.
 * 异常:
 *     无.
 */
export default async function AdminExamPublishDetailPage({
  params,
}: AdminExamPublishDetailPageProps) {
  const resolvedParams = await params;
  return <ExamPublishDetailAdminPage shareToken={resolvedParams.share_token} />;
}
