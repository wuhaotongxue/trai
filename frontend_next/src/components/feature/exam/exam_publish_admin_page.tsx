/**
 * 文件名: exam_publish_admin_page.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 19:26:25
 * 描述: 管理后台考试发布页面组件, 支持上传 Word 试卷并生成公开答题链接
 */
"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { CheckCircle2, Copy, Eye, FileUp, History, Link2, LoaderCircle, RefreshCw, Send, Sparkles } from "lucide-react";

import { useAdminToast } from "@/contexts/admin_toast_context";
import {
  adminExamApi,
  type PublishSharedExamResponse,
  type PublishedSharedExamListItem,
} from "@/lib/api_client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 考试发布后台页面组件.
 *
 * 用途:
 *     提供管理员上传 docx 试卷并生成公开答题链接的交互界面.
 * 参数:
 *     无.
 * 返回值:
 *     JSX.Element: 考试发布后台页面.
 * 异常:
 *     无显式异常, 页面内自行处理接口错误并提示.
 */
export function ExamPublishAdminPage() {
  const { toast } = useAdminToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareBaseUrl, setShareBaseUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishedResult, setPublishedResult] = useState<PublishSharedExamResponse["data"]>(null);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<PublishedSharedExamListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareBaseUrl(window.location.origin);
    }
    void loadPublishedHistory();
  }, []);

  const fileSummary = useMemo(() => {
    if (!selectedFile) {
      return "尚未选择试卷文件";
    }
    return `${selectedFile.name} · ${(selectedFile.size / 1024).toFixed(1)} KB`;
  }, [selectedFile]);

  /**
   * 基于当前前端站点生成可直接访问的答题页地址.
   *
   * 用途:
   *     兼容历史记录中保存了旧端口的 share_url, 始终给出当前站点可直接打开的地址.
   * 参数:
   *     shareToken: 分享令牌.
   * 返回值:
   *     string: 当前站点下的完整答题页地址.
   * 异常:
   *     无显式异常.
   */
  function buildCurrentSiteShareUrl(shareToken: string): string {
    if (typeof window === "undefined") {
      return `/exam/${shareToken}`;
    }
    return `${window.location.origin}/exam/${shareToken}`;
  }

  /**
   * 打开当前站点下的答题页地址.
   *
   * 用途:
   *     避免历史记录里的旧域名或旧端口导致链接无法打开.
   * 参数:
   *     shareToken: 分享令牌.
   * 返回值:
   *     void: 无返回值.
   * 异常:
   *     无显式异常.
   */
  function openCurrentSiteSharePage(shareToken: string): void {
    window.open(buildCurrentSiteShareUrl(shareToken), "_blank", "noopener,noreferrer");
  }

  /**
   * 拉取已发布考试历史列表.
   *
   * 用途:
   *     调用后端列表接口, 用于后台展示历史分享链接和答卷统计信息.
   * 参数:
   *     无.
   * 返回值:
   *     Promise<void>: 异步完成列表刷新.
   * 异常:
   *     无显式异常, 失败时通过 toast 提示.
   */
  async function loadPublishedHistory(): Promise<void> {
    setHistoryLoading(true);
    try {
      const response = await adminExamApi.listPublishedExams();
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || "获取发布记录失败");
      }
      setHistoryItems(response.data.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取发布记录失败";
      toast({ message, variant: "error" });
    } finally {
      setHistoryLoading(false);
    }
  }

  /**
   * 处理文件选择事件.
   *
   * 用途:
   *     校验文件类型并写入页面状态.
   * 参数:
   *     event: ChangeEvent<HTMLInputElement>, 文件输入事件对象.
   * 返回值:
   *     void: 无返回值.
   * 异常:
   *     无显式异常.
   */
  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      setSelectedFile(null);
      return;
    }
    const lowerName = nextFile.name.toLowerCase();
    if (!lowerName.endsWith(".docx")) {
      setSubmitError("当前仅支持上传 .docx 试卷文件");
      setSelectedFile(null);
      return;
    }
    setSubmitError("");
    setSelectedFile(nextFile);
  }

  /**
   * 提交发布考试请求.
   *
   * 用途:
   *     调用后端发布接口, 生成分享令牌和公开答题链接.
   * 参数:
   *     无.
   * 返回值:
   *     Promise<void>: 异步完成发布流程.
   * 异常:
   *     无显式异常, 失败时通过 toast 和页面文案提示.
   */
  async function handlePublishExam(): Promise<void> {
    if (!selectedFile) {
      setSubmitError("请先选择一份 Word 试卷");
      return;
    }
    if (!shareBaseUrl.trim()) {
      setSubmitError("请填写分享链接基地址");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await adminExamApi.publishSharedExam(selectedFile, shareBaseUrl);
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || "发布考试失败");
      }
      setPublishedResult(response.data);
      toast({
        message: `发布成功, 已生成分享链接 ${response.data.share_token}`,
        variant: "success",
      });
      await loadPublishedHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : "发布考试失败";
      setSubmitError(message);
      toast({ message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * 复制最新分享链接.
   *
   * 用途:
   *     将发布成功后的分享链接写入剪贴板.
   * 参数:
   *     无.
   * 返回值:
   *     Promise<void>: 异步复制完成.
   * 异常:
   *     无显式异常, 失败时通过 toast 提示.
   */
  async function handleCopyShareUrl(): Promise<void> {
    if (!publishedResult?.share_token) {
      return;
    }
    await handleCopyText(buildCurrentSiteShareUrl(publishedResult.share_token), "分享链接已复制");
  }

  /**
   * 复制任意文本到剪贴板.
   *
   * 用途:
   *     统一处理最新发布结果和历史记录中的链接复制交互.
   * 参数:
   *     text: 待复制文本.
   *     successMessage: 复制成功提示文案.
   * 返回值:
   *     Promise<void>: 异步复制完成.
   * 异常:
   *     无显式异常, 失败时通过 toast 提示.
   */
  async function handleCopyText(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ message: successMessage, variant: "success" });
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ message: "复制分享链接失败", variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a]">
            Exam Publish
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            发布考试后台页面
          </h1>
          <p className="max-w-3xl text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
            管理员可以直接在这里上传 Word 试卷. 后端会自动解析题目结构, 生成可公开访问的答题页链接. 当前主链路是自建答题页, AI 表格同步会在配置完整后自动接上.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-4 border-slate-900 bg-white px-4 py-3 shadow-[6px_6px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[6px_6px_0px_0px_#ffffff]">
            <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">文件格式</div>
            <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">DOCX</div>
          </div>
          <div className="border-4 border-slate-900 bg-white px-4 py-3 shadow-[6px_6px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[6px_6px_0px_0px_#ffffff]">
            <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">输出结果</div>
            <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">分享链接</div>
          </div>
          <div className="border-4 border-slate-900 bg-white px-4 py-3 shadow-[6px_6px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[6px_6px_0px_0px_#ffffff]">
            <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">后续同步</div>
            <div className="mt-1 text-lg font-black text-slate-900 dark:text-white">AI 表格</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
          <CardHeader className="border-b-4 border-slate-900 dark:border-white">
            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
              <FileUp className="h-5 w-5" />
              发布表单
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="exam-share-base-url" className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                分享链接基地址
              </Label>
              <Input
                id="exam-share-base-url"
                aria-label="Share base URL"
                value={shareBaseUrl}
                onChange={(event) => setShareBaseUrl(event.target.value)}
                placeholder="http://127.0.0.1:3000"
                className="h-12 border-4 border-slate-900 bg-white font-bold shadow-[4px_4px_0px_0px_#0f172a] focus-visible:ring-0 dark:border-white dark:bg-slate-950 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
              />
              <p className="text-xs font-bold leading-6 text-slate-600 dark:text-slate-400">
                这里决定生成后的分享链接域名. 本地联调时必须填当前前端实际端口, 例如 `http://127.0.0.1:3001` 或当前浏览器所在地址.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exam-docx-file" className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                上传 Word 试卷
              </Label>
              <Input
                id="exam-docx-file"
                type="file"
                aria-label="Upload exam docx file"
                title="Upload exam docx file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="h-14 border-4 border-dashed border-slate-900 bg-slate-50 px-4 py-3 font-bold shadow-[4px_4px_0px_0px_#0f172a] file:mr-4 file:border-2 file:border-slate-900 file:bg-cyan-300 file:px-3 file:py-1 file:text-sm file:font-black file:uppercase file:tracking-widest file:text-slate-900 dark:border-white dark:bg-slate-950 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff] dark:file:border-white"
              />
              <p className="text-sm font-black text-slate-900 dark:text-white">{fileSummary}</p>
            </div>

            {submitError && (
              <div className="border-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-black uppercase tracking-widest text-red-600 dark:bg-red-950/30">
                {submitError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void handlePublishExam()}
                disabled={submitting}
                className="h-12 border-4 border-slate-900 bg-cyan-400 px-6 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:bg-cyan-300 disabled:opacity-60 dark:border-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
              >
                {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {submitting ? "发布中" : "发布考试"}
              </Button>
              {publishedResult?.share_url && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCopyShareUrl()}
                    className="h-12 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? "已复制" : "复制链接"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(publishedResult.share_url, "_blank", "noopener,noreferrer")}
                    className="h-12 border-4 border-slate-900 bg-white px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    打开原始链接
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openCurrentSiteSharePage(publishedResult.share_token)}
                    className="h-12 border-4 border-slate-900 bg-cyan-200 px-5 text-sm font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-cyan-700/40 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    打开当前站点
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
            <CardHeader className="border-b-4 border-slate-900 dark:border-white">
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <Sparkles className="h-5 w-5" />
                发布说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
              <p>1. 上传 `.docx` 试卷文件.</p>
              <p>2. 点击“发布考试”, 后端会自动解析题目并生成分享令牌.</p>
              <p>3. 发布成功后, 可直接复制答题链接或点击“打开预览”.</p>
              <p>4. 考生在公开答题页提交后, 后端自动评分并尝试同步 AI 表格.</p>
            </CardContent>
          </Card>

          <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
            <CardHeader className="border-b-4 border-slate-900 dark:border-white">
              <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                <Link2 className="h-5 w-5" />
                最近发布结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {!publishedResult ? (
                <p className="text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
                  暂无最近发布记录. 发布成功后, 这里会显示分享令牌, 题目数和公开答题页链接.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 border-2 border-slate-900 bg-emerald-100 px-3 py-2 text-sm font-black uppercase tracking-widest text-slate-900 dark:border-white dark:bg-emerald-700/30 dark:text-white">
                    <CheckCircle2 className="h-4 w-4" />
                    发布成功
                  </div>
                  <div className="space-y-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Exam ID</div>
                      <div className="break-all text-slate-900 dark:text-white">{publishedResult.exam_id}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Share Token</div>
                      <div className="break-all text-slate-900 dark:text-white">{publishedResult.share_token}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Questions</div>
                      <div className="text-slate-900 dark:text-white">{publishedResult.question_count}</div>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">当前可访问地址</div>
                      <div className="break-all text-slate-900 dark:text-white">
                        {buildCurrentSiteShareUrl(publishedResult.share_token)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">发布时保存的原始链接</div>
                      <div className="break-all text-slate-900 dark:text-white">{publishedResult.share_url}</div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0px_0px_#ffffff]">
            <CardHeader className="border-b-4 border-slate-900 dark:border-white">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  <History className="h-5 w-5" />
                  发布记录列表
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void loadPublishedHistory()}
                  className="h-10 border-4 border-slate-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新列表
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {historyLoading ? (
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  加载发布记录
                </div>
              ) : historyItems.length === 0 ? (
                <p className="text-sm font-bold leading-7 text-slate-700 dark:text-slate-300">
                  暂无历史发布记录. 你可以先上传一份 Word 试卷并点击“发布考试”, 然后这里会出现可重复打开的历史分享链接.
                </p>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div
                      key={item.exam_id}
                      className="space-y-4 border-4 border-slate-900 bg-slate-50 p-4 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-950 dark:shadow-[4px_4px_0px_0px_#ffffff]"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <div className="text-lg font-black uppercase tracking-wide text-slate-900 dark:text-white">
                            {item.paper_title || "未命名试卷"}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-widest">
                            <span className="border-2 border-slate-900 bg-cyan-200 px-2 py-1 text-slate-900 dark:border-white dark:bg-cyan-600 dark:text-white">
                              {item.question_count} 题
                            </span>
                            <span className="border-2 border-slate-900 bg-amber-200 px-2 py-1 text-slate-900 dark:border-white dark:bg-amber-600 dark:text-white">
                              {item.submission_count} 份答卷
                            </span>
                            {item.position && (
                              <span className="border-2 border-slate-900 bg-white px-2 py-1 text-slate-900 dark:border-white dark:bg-slate-900 dark:text-white">
                                {item.position}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `/admin/exam_publish/${item.share_token}`;
                            }}
                            className="h-10 border-4 border-slate-900 bg-emerald-200 px-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-emerald-700/40 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            查看详情
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleCopyText(buildCurrentSiteShareUrl(item.share_token), "历史分享链接已复制")}
                            className="h-10 border-4 border-slate-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            复制历史链接
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => openCurrentSiteSharePage(item.share_token)}
                            className="h-10 border-4 border-slate-900 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:border-white dark:bg-slate-900 dark:text-white dark:shadow-[4px_4px_0px_0px_#ffffff]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            当前站点打开
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 text-sm font-bold text-slate-700 dark:text-slate-300 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Share Token</div>
                          <div className="break-all text-slate-900 dark:text-white">{item.share_token}</div>
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">发布时间</div>
                          <div className="text-slate-900 dark:text-white">
                            {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">最近提交</div>
                          <div className="text-slate-900 dark:text-white">
                            {item.latest_submission_at ? new Date(item.latest_submission_at).toLocaleString() : "暂无提交"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">当前可访问地址</div>
                          <div className="break-all text-slate-900 dark:text-white">{buildCurrentSiteShareUrl(item.share_token)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">原始保存链接</div>
                          <div className="break-all text-slate-900 dark:text-white">{item.share_url}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
