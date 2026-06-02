/**
 * 文件名: exam_share_client.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 20:18:00
 * 描述: Public exam share client that loads paper detail, collects answers and submits the exam
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpToLine, CheckCircle2, Copy, LoaderCircle, Send, TriangleAlert } from "lucide-react";

import { ExamQuestionCard, type ExamAnswerDraft } from "@/components/feature/exam/exam_question_card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  publicExamApi,
  type PublicExamPaper,
  type PublicExamQuestion,
  type SubmitSharedExamAnswerRequest,
  type SubmitSharedExamResponse,
} from "@/lib/api_client";

interface ExamShareClientProps {
  shareToken: string;
}

type AnswerDraftMap = Record<number, ExamAnswerDraft>;

/**
 * Builds a default answer draft object.
 * @returns Empty answer draft.
 */
function createEmptyAnswerDraft(): ExamAnswerDraft {
  return { values: [], textAnswer: "" };
}

/**
 * Public exam client component used by the shared exam page.
 * @param props - Shared exam token from the route segment.
 * @returns Fully interactive public exam page.
 */
export function ExamShareClient({ shareToken }: ExamShareClientProps) {
  const [paper, setPaper] = useState<PublicExamPaper | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);
  const [candidateName, setCandidateName] = useState("");
  const [candidateDepartment, setCandidateDepartment] = useState("");
  const [answers, setAnswers] = useState<AnswerDraftMap>({});
  const [result, setResult] = useState<SubmitSharedExamResponse["data"]>(null);
  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const allQuestions = useMemo<PublicExamQuestion[]>(
    () => paper?.sections.flatMap((section) => section.questions) ?? [],
    [paper]
  );

  useEffect(() => {
    let active = true;

    async function loadExamDetail() {
      setLoading(true);
      setPageError("");
      try {
        const response = await publicExamApi.getSharedExamDetail(shareToken);
        if (!active) {
          return;
        }
        if (response.code !== 200 || !response.data) {
          throw new Error(response.msg || "Failed to load public exam");
        }
        setPaper(response.data.paper);
        setShareUrl(response.data.share_url);
        setQuestionCount(response.data.question_count);
        setSectionCount(response.data.section_count);
      } catch (error) {
        if (!active) {
          return;
        }
        setPageError(error instanceof Error ? error.message : "Failed to load public exam");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadExamDetail();

    return () => {
      active = false;
    };
  }, [shareToken]);

  /**
   * Returns the current draft for one question.
   * @param questionNo - Question number.
   * @returns Existing draft or empty draft.
   */
  function getAnswerDraft(questionNo: number): ExamAnswerDraft {
    return answers[questionNo] ?? createEmptyAnswerDraft();
  }

  /**
   * Updates a single choice answer.
   * @param questionNo - Question number.
   * @param value - Selected option key.
   * @returns Nothing.
   */
  function handleSingleChoiceChange(questionNo: number, value: string): void {
    setAnswers((current) => ({
      ...current,
      [questionNo]: { values: [value], textAnswer: "" },
    }));
  }

  /**
   * Toggles one option inside a multiple choice answer.
   * @param questionNo - Question number.
   * @param value - Option key to toggle.
   * @returns Nothing.
   */
  function handleMultipleChoiceToggle(questionNo: number, value: string): void {
    setAnswers((current) => {
      const draft = current[questionNo] ?? createEmptyAnswerDraft();
      const nextValues = draft.values.includes(value)
        ? draft.values.filter((item) => item !== value)
        : [...draft.values, value];
      return {
        ...current,
        [questionNo]: { values: nextValues, textAnswer: "" },
      };
    });
  }

  /**
   * Updates a text answer.
   * @param questionNo - Question number.
   * @param value - Free text answer.
   * @returns Nothing.
   */
  function handleTextAnswerChange(questionNo: number, value: string): void {
    setAnswers((current) => ({
      ...current,
      [questionNo]: { values: [], textAnswer: value },
    }));
  }

  /**
   * Converts the share URL from backend into a browser friendly absolute URL.
   * @returns Absolute share URL string.
   */
  function buildBrowserShareUrl(): string {
    if (!shareUrl) {
      return typeof window === "undefined" ? "" : window.location.href;
    }
    if (shareUrl.startsWith("http://") || shareUrl.startsWith("https://")) {
      return shareUrl;
    }
    return typeof window === "undefined" ? shareUrl : new URL(shareUrl, window.location.origin).toString();
  }

  /**
   * Submits the public exam answers to backend.
   * @returns Nothing.
   */
  async function handleSubmit(): Promise<void> {
    if (!paper) {
      return;
    }
    if (!candidateName.trim() || !candidateDepartment.trim()) {
      setSubmitError("请先填写姓名和部门");
      return;
    }

    const answerPayload: SubmitSharedExamAnswerRequest[] = allQuestions.map((question) => {
      const draft = getAnswerDraft(question.question_no);
      return {
        question_no: question.question_no,
        values: draft.values,
        text_answer: draft.textAnswer.trim() || undefined,
      };
    });
    const hasAnyAnswer = answerPayload.some(
      (item) => item.values.length > 0 || Boolean(item.text_answer?.trim())
    );
    if (!hasAnyAnswer) {
      setSubmitError("请至少完成 1 道题");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await publicExamApi.submitSharedExam({
        share_token: shareToken,
        candidate_name: candidateName.trim(),
        candidate_department: candidateDepartment.trim(),
        answers: answerPayload,
      });
      if (response.code !== 200 || !response.data) {
        throw new Error(response.msg || "Failed to submit exam");
      }
      setResult(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyShareUrl(): Promise<void> {
    const browserShareUrl = buildBrowserShareUrl();
    await navigator.clipboard.writeText(browserShareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  /**
   * 滚动到页面顶部.
   *
   * 用途:
   *     方便考生在长试卷中快速回到顶部查看结果和基础信息.
   * 参数:
   *     无.
   * 返回值:
   *     void: 无返回值.
   * 异常:
   *     无显式异常.
   */
  function scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * 滚动到页面底部.
   *
   * 用途:
   *     提供一键到底能力, 让考生快速到达提交区域.
   * 参数:
   *     无.
   * 返回值:
   *     void: 无返回值.
   * 异常:
   *     无显式异常.
   */
  function scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="flex items-center gap-3 border-4 border-slate-900 bg-white px-6 py-4 shadow-[8px_8px_0px_0px_#0f172a]">
          <LoaderCircle className="h-5 w-5 animate-spin text-slate-900" />
          <span className="text-sm font-black uppercase tracking-widest text-slate-900">Loading exam</span>
        </div>
      </div>
    );
  }

  if (pageError || !paper) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a]">
            <CardContent className="space-y-4 p-8">
              <div className="flex items-center gap-3 text-slate-900">
                <TriangleAlert className="h-6 w-6" />
                <h1 className="text-2xl font-black uppercase tracking-widest">Exam unavailable</h1>
              </div>
              <p className="text-base font-bold text-slate-700">{pageError || "Public exam not found"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {result && (
          <Card className="border-4 border-slate-900 bg-emerald-200 shadow-[8px_8px_0px_0px_#0f172a]">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-black uppercase tracking-widest">Submission received</span>
                </div>
                <div className="text-3xl font-black uppercase tracking-tight">
                  Score {result.score} / {result.total_score}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest text-slate-700">
                  Review {result.requires_manual_review ? "required" : "not required"}
                </div>
              </div>
              <div className="text-sm font-black uppercase tracking-widest text-slate-800">
                Sync {String(result.sync_result?.status ?? "pending")}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-4 border-slate-900 bg-white shadow-[10px_10px_0px_0px_#0f172a]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-4">
              <div className="inline-flex border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-widest">
                Public exam
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight md:text-5xl">{paper.paper_title}</h1>
              <p className="text-base font-bold leading-7 text-slate-700">
                Position {paper.position || "General"} | Duration {paper.duration_minutes ?? 0} min | Total score {paper.total_score}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
              <div className="border-4 border-slate-900 bg-amber-200 p-4 shadow-[6px_6px_0px_0px_#0f172a]">
                <div className="text-xs font-black uppercase tracking-widest">Questions</div>
                <div className="mt-2 text-3xl font-black">{questionCount}</div>
              </div>
              <div className="border-4 border-slate-900 bg-slate-100 p-4 shadow-[6px_6px_0px_0px_#0f172a]">
                <div className="text-xs font-black uppercase tracking-widest">Sections</div>
                <div className="mt-2 text-3xl font-black">{sectionCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="candidate-name" className="text-sm font-black uppercase tracking-widest">姓名</Label>
              <Input id="candidate-name" aria-label="Candidate name" value={candidateName} onChange={(event) => setCandidateName(event.target.value)} className="h-12 border-4 border-slate-900 bg-white font-bold shadow-[4px_4px_0px_0px_#0f172a] focus-visible:ring-0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate-department" className="text-sm font-black uppercase tracking-widest">部门</Label>
              <Input id="candidate-department" aria-label="Candidate department" value={candidateDepartment} onChange={(event) => setCandidateDepartment(event.target.value)} className="h-12 border-4 border-slate-900 bg-white font-bold shadow-[4px_4px_0px_0px_#0f172a] focus-visible:ring-0" />
            </div>
            <Button type="button" onClick={() => void handleCopyShareUrl()} className="h-12 border-4 border-slate-900 bg-slate-900 px-5 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_#0f172a] hover:bg-slate-800">
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "已复制" : "复制链接"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-4 border-slate-900 bg-cyan-100 shadow-[8px_8px_0px_0px_#0f172a]">
          <CardContent className="space-y-3 p-6">
            <div className="text-sm font-black uppercase tracking-widest">当前可访问分享链接</div>
            <div className="break-all text-sm font-bold leading-7 text-slate-900">{buildBrowserShareUrl()}</div>
            <p className="text-xs font-bold leading-6 text-slate-700">
              如果你看到的旧链接是 `3000` 或写成了 `http://localhost/:3000/...`, 请以这里显示的当前地址为准.
            </p>
          </CardContent>
        </Card>

        {paper.warning_messages.length > 0 && (
          <Card className="border-4 border-slate-900 bg-amber-100 shadow-[8px_8px_0px_0px_#0f172a]">
            <CardContent className="space-y-2 p-6">
              <div className="text-sm font-black uppercase tracking-widest">Warnings</div>
              {paper.warning_messages.map((warningMessage) => (
                <p key={warningMessage} className="text-sm font-bold leading-6 text-slate-800">
                  {warningMessage}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {paper.sections.map((section) => (
          <section key={section.section_title} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="border-4 border-slate-900 bg-cyan-300 px-4 py-2 text-xl font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#0f172a]">
                {section.section_title}
              </h2>
              <span className="text-sm font-black uppercase tracking-widest text-slate-700">
                {section.questions.length} questions
              </span>
            </div>
            <div className="grid gap-5">
              {section.questions.map((question) => (
                <ExamQuestionCard
                  key={question.question_no}
                  question={question}
                  answer={getAnswerDraft(question.question_no)}
                  onSingleChoiceChange={handleSingleChoiceChange}
                  onMultipleChoiceToggle={handleMultipleChoiceToggle}
                  onTextAnswerChange={handleTextAnswerChange}
                />
              ))}
            </div>
          </section>
        ))}

        <Card className="border-4 border-slate-900 bg-white shadow-[10px_10px_0px_0px_#0f172a]">
          <CardContent className="space-y-4 p-6">
            {submitError && <p className="text-sm font-black uppercase tracking-widest text-red-600">{submitError}</p>}
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting} className="h-14 w-full border-4 border-slate-900 bg-cyan-400 text-lg font-black uppercase tracking-widest text-slate-900 shadow-[6px_6px_0px_0px_#0f172a] hover:bg-cyan-300 disabled:opacity-60">
              {submitting ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              {submitting ? "提交中" : "提交答卷"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <Button
          type="button"
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
          onClick={scrollToBottom}
          className="h-12 w-12 border-4 border-slate-900 bg-cyan-300 p-0 text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:bg-cyan-200"
        >
          <ArrowDownToLine className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          aria-label="Scroll to top"
          title="Scroll to top"
          onClick={scrollToTop}
          className="h-12 w-12 border-4 border-slate-900 bg-white p-0 text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] hover:bg-slate-100"
        >
          <ArrowUpToLine className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
