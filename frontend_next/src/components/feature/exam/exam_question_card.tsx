/**
 * 文件名: exam_question_card.tsx
 * 作者: wuhao
 * 日期: 2026-06-02 20:12:00
 * 描述: Question card renderer for the public exam share page
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { PublicExamQuestion } from "@/lib/api_client";

/**
 * Mutable answer draft kept on the client before submit.
 */
export interface ExamAnswerDraft {
  values: string[];
  textAnswer: string;
}

interface ExamQuestionCardProps {
  question: PublicExamQuestion;
  answer: ExamAnswerDraft;
  onSingleChoiceChange: (questionNo: number, value: string) => void;
  onMultipleChoiceToggle: (questionNo: number, value: string) => void;
  onTextAnswerChange: (questionNo: number, value: string) => void;
}

/**
 * Renders one question block for the public exam page.
 * @param props - Question data, current answer draft and change handlers.
 * @returns Question card element.
 */
export function ExamQuestionCard({
  question,
  answer,
  onSingleChoiceChange,
  onMultipleChoiceToggle,
  onTextAnswerChange,
}: ExamQuestionCardProps) {
  const isShortAnswer = question.question_type === "short_answer";
  const isMultipleChoice = question.question_type === "multiple_choice";

  return (
    <Card className="border-4 border-slate-900 bg-white shadow-[8px_8px_0px_0px_#0f172a]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center border-2 border-slate-900 bg-cyan-300 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900">
                Q{question.question_no}
              </span>
              <span className="inline-flex items-center border-2 border-slate-900 bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-900">
                {question.question_type.replaceAll("_", " ")}
              </span>
            </div>
            <h3 className="text-lg font-black leading-7 text-slate-900">{question.stem}</h3>
          </div>
          <div className="inline-flex h-fit items-center border-2 border-slate-900 bg-amber-200 px-3 py-2 text-sm font-black uppercase tracking-widest text-slate-900">
            {question.score} pts
          </div>
        </div>

        {isShortAnswer ? (
          <div className="space-y-2">
            <label
              htmlFor={`question-${question.question_no}-textarea`}
              className="block text-sm font-black uppercase tracking-widest text-slate-900"
            >
              Your answer
            </label>
            <Textarea
              id={`question-${question.question_no}-textarea`}
              aria-label={`Question ${question.question_no} answer`}
              placeholder="Write your answer here"
              value={answer.textAnswer}
              onChange={(event) => onTextAnswerChange(question.question_no, event.target.value)}
              className="border-4 border-slate-900 bg-white text-base font-medium text-slate-900 shadow-[4px_4px_0px_0px_#0f172a] focus-visible:ring-0"
            />
          </div>
        ) : (
          <div className="grid gap-3">
            {question.options.map((option) => {
              const checked = answer.values.includes(option.key);
              const inputId = `question-${question.question_no}-${option.key}`;
              return (
                <label
                  key={option.key}
                  htmlFor={inputId}
                  className={`flex cursor-pointer items-start gap-3 border-4 border-slate-900 px-4 py-3 shadow-[4px_4px_0px_0px_#0f172a] transition-transform ${
                    checked ? "bg-cyan-200" : "bg-slate-50"
                  }`}
                >
                  <input
                    id={inputId}
                    type={isMultipleChoice ? "checkbox" : "radio"}
                    name={`question-${question.question_no}`}
                    aria-label={`Question ${question.question_no} option ${option.key}`}
                    checked={checked}
                    onChange={() =>
                      isMultipleChoice
                        ? onMultipleChoiceToggle(question.question_no, option.key)
                        : onSingleChoiceChange(question.question_no, option.key)
                    }
                    className="mt-1 h-4 w-4 rounded-none border-2 border-slate-900 accent-slate-900"
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-black uppercase tracking-widest text-slate-900">
                      {option.key}
                    </div>
                    <div className="text-sm font-bold leading-6 text-slate-700">{option.text}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
