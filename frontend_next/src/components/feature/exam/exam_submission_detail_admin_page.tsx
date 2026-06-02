/**
 * 文件名: exam_submission_detail_admin_page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 19:55:06
 * 描述: 管理后台答卷详情页组件, 用于展示考生答案, 自动评分明细和钉钉同步结果
 */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Copy,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  TableProperties,
  UserRound,
  XCircle,
} from "lucide-react";

import { useAdminToast } from "@/contexts/admin_toast_context";
import {
  adminExamApi,
  type PublishedSharedExamQuestionDetailItem,
  type PublishedSharedSubmissionDetailResponse,
} from "@/lib/api_client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamSubmissionDetailAdminPageProps {
  shareToken: string;
  submissionId: string;
}

/**
 * 管理后台答卷详情页组件.
 *
 * 用途:
 *     根据分享令牌和答卷 ID 展示考生信息, 钉钉同步结果和逐题评分明细.
 * 参数:
 *     props.shareToken: 所属考试分享令牌.
 *     props.submissionId: 目标答卷唯一 ID.
 * 返回值:
 *     JSX.Element: 后台答卷详情页界面.
 * 异常:
 *     无显式异常, 接口错误通过页面文案和 toast 提示.
 */
export function ExamSubmissionDetailAdminPage({
  shareToken,
  submissionId,
}: ExamSubmissionDetailAdminPageProps) {
  const { toast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [detail, setDetail] = useState<PublishedSharedSubmissionDetailResponse["data"]>(null);

  useEffect(() => {
    void loadDetail();
  }, [shareToken, submissionId]);

  /**
   * 加载答卷详情数据.
   *
   * 用途:
   *     调用后台答卷详情接口, 获取考生答案, 自动评分明细和钉钉同步结果.
   * 参数:
   *     无.
   * 返回值:
   *     Promise<void>: 异步完成数据加载.
   * 异常:
   *     无显式异常, 失败时通过页面和 toast 提示.
   */
  async function loadDetail(): Promise<void> {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await adminExamApi.getPublishedSubmissionDetail(shareToken, submissionId);
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || "获取答卷详情失败");
      }
      setDetail(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取答卷详情失败";
      setErrorMessage(message);
      toast({ message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  /**
   * 复制文本到剪贴板.
   *
   * 用途:
   *     支持复制答卷 ID 和钉钉同步结果 JSON.
   * 参数:
   *     text: 待复制文本.
   *     successMessage: 成功提示文案.
   * 返回值:
   *     Promise<void>: 异步完成复制.
   * 异常:
   *     无显式异常, 失败时通过 toast 提示.
   */
  async function copyText(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: successMessage, variant: "success" });
    } catch {
      toast({ message: "复制失败", variant: "error" });
    }
  }

  /**
   * 格式化时间显示.
   *
   * 用途:
   *     将时间字符串转换为本地可读文案.
   * 参数:
   *     value: 原始时间字符串.
   * 返回值:
   *     string: 格式化后的时间文本.
   * 异常:
   *     无.
   */
  function formatDateTime(value: string | null | undefined): string {
    if (!value) {
      return "暂无";
    }
    return new Date(value).toLocaleString();
  }

  /**
   * 构建评分状态标签.
   *
   * 用途:
   *     将后端评分状态转换为界面上可读的颜色块.
   * 参数:
   *     status: 评分状态值.
   * 返回值:
   *     ReactNode: 状态标签节点.
   * 异常:
   *     无.
   */
  function renderStatusBadge(status: string): ReactNode {
    if (status === "correct") {
      return (
        <span className="inline-flex items-center gap-2 border-2 border-slate-900 bg-emerald-200 px-2 py-1 text-xs font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-emerald-700/40 dark:text-white">
          <CheckCircle2 className="h-3.5 w-3.5" />
          正确
        </span>
      );
    }
    if (status === "incorrect") {
      return (
        <span className="inline-flex items-center gap-2 border-2 border-slate-900 bg-red-200 px-2 py-1 text-xs font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-red-700/40 dark:text-white">
          <XCircle className="h-3.5 w-3.5" />
          错误
        </span>
      );
    }
    if (status === "manual_review") {
      return (
        <span className="inline-flex items-center gap-2 border-2 border-slate-900 bg-amber-200 px-2 py-1 text-xs font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-amber-700/40 dark:text-white">
          <ShieldAlert className="h-3.5 w-3.5" />
          待复核
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 border-2 border-slate-900 bg-white px-2 py-1 text-xs font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
        未作答
      </span>
    );
  }

  /**
   * 渲染逐题评分明细列表.
   *
   * 用途:
   *     将答卷逐题详情渲染为后台可读的评分卡片.
   * 参数:
   *     questionDetails: 逐题评分明细数组.
   * 返回值:
   *     ReactNode: 逐题详情节点.
   * 异常:
   *     无.
   */
  function renderQuestionDetails(questionDetails: PublishedSharedExamQuestionDetailItem[]): ReactNode {
    return (
      <div className="space-y-4">
        {questionDetails.map((item) => (
          <div
            key={`${item.question_no}-${item.question_type}`}
            className="space-y-4 border-4 border-slate-900 bg-slate-50 p-4 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-950 dark:shadow-[4px_4px_0px_0px_#ffffff]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="text-lg font-black tracking-wide text-slate-900 dark:text-white">
                  第 {item.question_no} 题
                </div>
                <div className="text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">{item.stem}</div>
                <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-widest">
                  <span className="border-2 border-slate-900 bg-cyan-200 px-2 py-1 text-slate-900 dark:border-white dark:bg-cyan-700/40 dark:text-white">
                    {item.section_title || "未分组"}
                  </span>
                  <span className="border-2 border-slate-900 bg-white px-2 py-1 text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
                    {item.question_type}
                  </span>
                  <span className="border-2 border-slate-900 bg-white px-2 py-1 text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
                    {item.awarded_score ?? "-"} / {item.max_score}
                  </span>
                </div>
              </div>
              {renderStatusBadge(item.evaluation_status)}
            </div>

            <div className="grid gap-4 text-sm font-bold text-slate-700 dark:text-slate-300 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">标准答案</div>
                <div className="min-h-12 border-2 border-slate-900 bg-white px-3 py-2 text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
                  {item.standard_answer.length > 0 ? item.standard_answer.join(", ") : item.reference_answer || "暂无"}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">考生答案</div>
                <div className="min-h-12 border-2 border-slate-900 bg-white px-3 py-2 text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
                  {item.candidate_values.length > 0 ? item.candidate_values.join(", ") : item.candidate_text || "未作答"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
            Submission Detail
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            答卷详情页
          </h1>
          <p className="max-w-3xl text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
            这里展示单份答卷的考生答案, 自动评分明细, 主观题复核状态以及钉钉 AI 表格同步结果详情.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = `/admin/exam_publish/${shareToken}`;
            }}
            className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回考试详情
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadDetail()}
            className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新详情
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
          <CardContent className="flex items-center gap-3 p-6 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            加载答卷详情
          </CardContent>
        </Card>
      ) : errorMessage ? (
        <Card className="border-4 border-red-600 bg-red-50 shadow-[8px_8px_0px_0px_#7f1d1d] dark:bg-red-950/30">
          <CardContent className="p-6 text-sm font-black uppercase tracking-widest text-red-600">
            {errorMessage}
          </CardContent>
        </Card>
      ) : detail ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
              <CardHeader className="border-b-4 border-slate-900 dark:border-white">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  <UserRound className="h-5 w-5" />
                  考生摘要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 text-sm font-bold text-slate-700 dark:text-slate-300">
                <div className="text-lg font-black text-slate-900 dark:text-white">{detail.candidate_name}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">部门</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.candidate_department}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">得分</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.score} / {detail.total_score}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">提交时间</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{formatDateTime(detail.submitted_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">复核状态</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.requires_manual_review ? "需人工复核" : "自动评分完成"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Submission ID</div>
                  <div className="mt-1 break-all text-slate-900 dark:text-white">{detail.submission_id}</div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">试卷标题</div>
                  <div className="mt-1 text-slate-900 dark:text-white">{detail.paper_title}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyText(detail.submission_id, "答卷 ID 已复制")}
                  className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制答卷 ID
                </Button>
              </CardContent>
            </Card>

            <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
              <CardHeader className="border-b-4 border-slate-900 dark:border-white">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  <TableProperties className="h-5 w-5" />
                  钉钉同步结果
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 text-sm font-bold text-slate-700 dark:text-slate-300">
                <div className="inline-flex items-center border-2 border-slate-900 bg-amber-200 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-amber-700/40 dark:text-white">
                  状态: {detail.sync_status}
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">同步结果 JSON</div>
                  <pre className="mt-2 overflow-x-auto border-2 border-slate-900 bg-slate-50 p-3 text-xs leading-6 text-slate-900 dark:border-white dark:bg-slate-950 dark:text-white">
                    {JSON.stringify(detail.sync_result, null, 2)}
                  </pre>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void copyText(JSON.stringify(detail.sync_result, null, 2), "同步结果已复制")}
                  className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制同步结果
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
            <CardHeader className="border-b-4 border-slate-900 dark:border-white">
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <ClipboardList className="h-5 w-5" />
                自动评分明细
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">{renderQuestionDetails(detail.question_details)}</CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
