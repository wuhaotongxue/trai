/**
 * 文件名: page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 19:26:25
 * 描述: 管理后台考试发布页面入口
 */
import { ExamPublishAdminPage } from "@/components/feature/exam/exam_publish_admin_page";

/**
 * 管理后台考试发布页面入口.
 *
 * 用途:
 *     承载管理员发布考试的后台页面.
 * 参数:
 *     无.
 * 返回值:
 *     JSX.Element: 发布考试页面.
 * 异常:
 *     无.
 */
export default function AdminExamPublishPage() {
  return <ExamPublishAdminPage />;
}
