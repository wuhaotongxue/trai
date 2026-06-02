/**
 * 文件名: exam_publish_detail_admin_page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 19:42:07
 * 描述: 管理后台已发布考试详情页组件, 用于展示考试信息和答卷列表
 */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Clock3, Copy, ExternalLink, FileText, LoaderCircle, RefreshCw, Search, Users } from "lucide-react";

import { useAdminToast } from "@/contexts/admin_toast_context";
import {
  adminExamApi,
  type PublishedSharedExamDetailResponse,
  type PublishedSharedExamSubmissionItem,
} from "@/lib/api_client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExamPublishDetailAdminPageProps {
  shareToken: string;
}

/**
 * 管理后台已发布考试详情组件.
 *
 * 用途:
 *     展示考试基础信息, 分享链接和答卷列表, 便于后台查看已发布考试的提交情况.
 * 参数:
 *     props.shareToken: 分享令牌, 用于请求后台详情接口.
 * 返回值:
 *     JSX.Element: 已发布考试详情页界面.
 * 异常:
 *     无显式异常, 接口错误通过页面提示和 toast 反馈.
 */
export function ExamPublishDetailAdminPage({ shareToken }: ExamPublishDetailAdminPageProps) {
  const { toast } = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [detail, setDetail] = useState<PublishedSharedExamDetailResponse["data"]>(null);

  useEffect(() => {
    void loadDetail();
  }, [shareToken]);

  /**
   * 加载已发布考试详情.
   *
   * 用途:
   *     调用后台详情接口, 获取考试基本信息和答卷列表.
   * 参数:
   *     无.
   * 返回值:
   *     Promise<void>: 异步完成详情加载.
   * 异常:
   *     无显式异常, 失败时通过页面和 toast 提示.
   */
  async function loadDetail(): Promise<void> {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await adminExamApi.getPublishedExamDetail(shareToken);
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || "获取考试详情失败");
      }
      setDetail(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取考试详情失败";
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
   *     支持复制分享链接和分享令牌.
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
   *     将 ISO 时间转换为本地可读时间, 空值时返回占位文案.
   * 参数:
   *     value: 原始时间字符串.
   * 返回值:
   *     string: 本地化时间文本.
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
   * 生成当前前端站点下的可访问答题页地址.
   *
   * 用途:
   *     当历史发布记录保存了旧端口时, 仍然给后台提供当前站点可直接打开的地址.
   * 参数:
   *     无.
   * 返回值:
   *     string: 当前站点下的完整分享链接.
   * 异常:
   *     无.
   */
  function buildCurrentSiteShareUrl(): string {
    if (typeof window === "undefined") {
      return `/exam/${shareToken}`;
    }
    return `${window.location.origin}/exam/${shareToken}`;
  }

  /**
   * 渲染答卷列表.
   *
   * 用途:
   *     将答卷摘要数组渲染为后台管理卡片列表.
   * 参数:
   *     submissions: 答卷摘要数组.
   * 返回值:
   *     JSX.Element: 答卷列表区域.
   * 异常:
   *     无.
   */
  function renderSubmissions(submissions: PublishedSharedExamSubmissionItem[]): ReactNode {
    if (submissions.length === 0) {
      return (
        <div className="border-4 border-slate-900 bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-700 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-950 dark:text-slate-300 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          当前还没有答卷提交记录.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {submissions.map((item) => (
          <div
            key={item.submission_id}
            className="space-y-4 border-4 border-slate-900 bg-slate-50 p-4 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-950 dark:shadow-[4px_4px_0px_0px_#ffffff]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  {item.candidate_name || "未命名考生"}
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-widest">
                  <span className="border-2 border-slate-900 bg-cyan-200 px-2 py-1 text-slate-900 dark:border-white dark:bg-cyan-600 dark:text-white">
                    {item.score}/{item.total_score}
                  </span>
                  <span className="border-2 border-slate-900 bg-white px-2 py-1 text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
                    {item.candidate_department || "未填写部门"}
                  </span>
                  <span className="border-2 border-slate-900 bg-amber-200 px-2 py-1 text-slate-900 dark:border-white dark:bg-amber-600 dark:text-white">
                    {item.requires_manual_review ? "需人工复核" : "自动评分完成"}
                  </span>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                提交时间: {formatDateTime(item.submitted_at)}
              </div>
            </div>

            <div className="grid gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-3">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Submission ID</div>
                <div className="break-all text-slate-900 dark:text-white">{item.submission_id}</div>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Sync Status</div>
                <div className="text-slate-900 dark:text-white">{item.sync_status}</div>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/admin/exam_publish/${shareToken}/submission/${item.submission_id}`;
                  }}
                  className="h-10 w-full border-4 border-slate-900 bg-emerald-200 px-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-emerald-700/40 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                >
                  <Search className="mr-2 h-4 w-4" />
                  查看答卷详情
                </Button>
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
            Exam Detail
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            已发布考试详情
          </h1>
          <p className="max-w-3xl text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
            这里展示已发布考试的分享信息和答卷列表, 便于后台追踪题目数量, 提交情况和 AI 表格同步状态.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = "/admin/exam_publish";
            }}
            className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
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
            加载考试详情
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
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
              <CardHeader className="border-b-4 border-slate-900 dark:border-white">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  <FileText className="h-5 w-5" />
                  考试信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 text-sm font-bold text-slate-700 dark:text-slate-300">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">试卷标题</div>
                  <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">{detail.paper_title || "未命名试卷"}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">题目数</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.question_count}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">总分</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.total_score ?? "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">时长</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.duration_minutes ? `${detail.duration_minutes} 分钟` : "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">岗位</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{detail.position || "-"}</div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">发布时间</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{formatDateTime(detail.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">更新时间</div>
                    <div className="mt-1 text-slate-900 dark:text-white">{formatDateTime(detail.updated_at)}</div>
                  </div>
                </div>
                {detail.warning_messages.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">解析告警</div>
                    <div className="space-y-2">
                      {detail.warning_messages.map((item) => (
                        <div
                          key={item}
                          className="border-2 border-slate-900 bg-amber-100 px-3 py-2 text-sm font-bold text-slate-900 dark:border-white dark:bg-amber-700/30 dark:text-white"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
              <CardHeader className="border-b-4 border-slate-900 dark:border-white">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  <Clock3 className="h-5 w-5" />
                  分享信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6 text-sm font-bold text-slate-700 dark:text-slate-300">
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Share Token</div>
                  <div className="mt-1 break-all text-slate-900 dark:text-white">{detail.share_token}</div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">当前可访问地址</div>
                  <div className="mt-1 break-all text-slate-900 dark:text-white">{buildCurrentSiteShareUrl()}</div>
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">发布时保存的原始链接</div>
                  <div className="mt-1 break-all text-slate-900 dark:text-white">{detail.share_url}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyText(detail.share_token, "分享令牌已复制")}
                    className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制令牌
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyText(buildCurrentSiteShareUrl(), "分享链接已复制")}
                    className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    复制当前链接
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(buildCurrentSiteShareUrl(), "_blank", "noopener,noreferrer")}
                    className="h-11 border-4 border-slate-900 bg-cyan-200 px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-cyan-700/40 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    打开当前站点
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(detail.share_url, "_blank", "noopener,noreferrer")}
                    className="h-11 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    打开原始链接
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
            <CardHeader className="border-b-4 border-slate-900 dark:border-white">
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <Users className="h-5 w-5" />
                答卷列表
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="inline-flex items-center border-2 border-slate-900 bg-amber-200 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-amber-700/40 dark:text-white">
                当前共 {detail.submission_count} 份答卷
              </div>
              {renderSubmissions(detail.submissions)}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
