/**
 * 文件名: components/agent/agent_type_selector.tsx
 * 作者: wuhao
 * 日期: 2026-05-04 21:30:00
 * 描述: Agent类型选择器组件, 展示18种Agent类型的分类网格布局
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Code,
  Languages,
  PenTool,
  Eye,
  ImagePlus,
  ScanLine,
  Mic,
  Volume2,
  BarChart3,
  FileSearch,
  BookOpen,
  FileText,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentTypeValue, AgentListItem } from "@/lib/api_client";

/** Agent category definition */
type AgentCategory = "chat" | "vision" | "audio" | "document" | "data";

/** Category config with colors (NO PURPLE - using blue/cyan/emerald/amber/orange) */
const CATEGORY_CONFIG: Record<
  AgentCategory,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColorClass: string;
    textColorClass: string;
    borderColorClass: string;
  }
> = {
  chat: {
    label: "Chat",
    icon: Bot,
    bgColorClass: "bg-blue-500/10",
    textColorClass: "text-blue-600 dark:text-blue-400",
    borderColorClass: "border-blue-200 dark:border-blue-800",
  },
  vision: {
    label: "Vision",
    icon: Eye,
    bgColorClass: "bg-emerald-500/10",
    textColorClass: "text-emerald-600 dark:text-emerald-400",
    borderColorClass: "border-emerald-200 dark:border-emerald-800",
  },
  audio: {
    label: "Audio",
    icon: Mic,
    bgColorClass: "bg-slate-200/10",
    textColorClass: "text-cyan-600 dark:text-cyan-400",
    borderColorClass: "border-cyan-200 dark:border-cyan-800",
  },
  document: {
    label: "Document",
    icon: FileText,
    bgColorClass: "bg-slate-200/10",
    textColorClass: "text-cyan-600 dark:text-cyan-400",
    borderColorClass: "border-cyan-200 dark:border-cyan-800",
  },
  data: {
    label: "Data",
    icon: BarChart3,
    bgColorClass: "bg-orange-500/10",
    textColorClass: "text-orange-600 dark:text-orange-400",
    borderColorClass: "border-orange-200 dark:border-orange-800",
  },
};

/** Default agent definitions (fallback when API unavailable) */
const DEFAULT_AGENTS: AgentListItem[] = [
  // Chat agents
  {
    agent_id: "chat",
    name: "General Chat",
    description: "Multi-turn conversation assistant",
    type: "chat",
    category: "chat",
    input_modalities: ["text"],
    output_modalities: ["text"],
    streaming_supported: true,
    icon: "Bot",
  },
  {
    agent_id: "code_assistant",
    name: "Code Assistant",
    description: "Programming and debugging helper",
    type: "code_assistant",
    category: "chat",
    input_modalities: ["text"],
    output_modalities: ["text", "data"],
    streaming_supported: true,
    icon: "Code",
  },
  {
    agent_id: "translator",
    name: "Translator",
    description: "Multi-language translation expert",
    type: "translator",
    category: "chat",
    input_modalities: ["text"],
    output_modalities: ["text"],
    streaming_supported: true,
    icon: "Languages",
  },
  {
    agent_id: "writer",
    name: "Writer",
    description: "Content creation assistant",
    type: "writer",
    category: "chat",
    input_modalities: ["text"],
    output_modalities: ["text"],
    streaming_supported: true,
    icon: "PenTool",
  },

  // Vision agents
  {
    agent_id: "vision",
    name: "Vision Analyzer",
    description: "Image understanding and analysis",
    type: "vision",
    category: "vision",
    input_modalities: ["image"],
    output_modalities: ["text"],
    streaming_supported: true,
    icon: "Eye",
  },
  {
    agent_id: "image_generator",
    name: "Image Generator",
    description: "AI image creation (DALL-E)",
    type: "image_generator",
    category: "vision",
    input_modalities: ["text"],
    output_modalities: ["image"],
    streaming_supported: false,
    icon: "ImagePlus",
  },
  {
    agent_id: "ocr_agent",
    name: "OCR Scanner",
    description: "Text extraction from images",
    type: "ocr_agent",
    category: "vision",
    input_modalities: ["image"],
    output_modalities: ["text"],
    streaming_supported: false,
    icon: "ScanLine",
  },

  // Audio agents
  {
    agent_id: "speech_to_text",
    name: "Speech to Text",
    description: "Voice transcription (Whisper)",
    type: "speech_to_text",
    category: "audio",
    input_modalities: ["audio"],
    output_modalities: ["text"],
    streaming_supported: false,
    icon: "Mic",
  },
  {
    agent_id: "text_to_speech",
    name: "Text to Speech",
    description: "Natural voice synthesis",
    type: "text_to_speech",
    category: "audio",
    input_modalities: ["text"],
    output_modalities: ["audio"],
    streaming_supported: false,
    icon: "Volume2",
  },

  // Document agents
  {
    agent_id: "pdf_parser",
    name: "PDF Parser",
    description: "Extract text and tables from PDFs",
    type: "pdf_parser",
    category: "document",
    input_modalities: ["document"],
    output_modalities: ["text", "data"],
    streaming_supported: false,
    icon: "FileText",
  },
  {
    agent_id: "document_qa",
    name: "Document QA",
    description: "Question answering on documents",
    type: "document_qa",
    category: "document",
    input_modalities: ["document", "text"],
    output_modalities: ["text"],
    streaming_supported: true,
    icon: "FileSearch",
  },
  {
    agent_id: "summarizer",
    name: "Summarizer",
    description: "Generate concise summaries",
    type: "summarizer",
    category: "document",
    input_modalities: ["text", "document"],
    output_modalities: ["text"],
    streaming_supported: true,
    icon: "BookOpen",
  },

  // Data agents
  {
    agent_id: "data_analyst",
    name: "Data Analyst",
    description: "Statistical analysis and insights",
    type: "data_analyst",
    category: "data",
    input_modalities: ["text", "data"],
    output_modalities: ["text", "chart"],
    streaming_supported: true,
    icon: "BarChart3",
  },
  {
    agent_id: "chart_generator",
    name: "Chart Generator",
    description: "Create visualizations from data",
    type: "chart_generator",
    category: "data",
    input_modalities: ["data", "text"],
    output_modalities: ["chart"],
    streaming_supported: false,
    icon: "TrendingUp",
  },
  {
    agent_id: "excel_processor",
    name: "Excel Processor",
    description: "Process spreadsheet data",
    type: "excel_processor",
    category: "data",
    input_modalities: ["data"],
    output_modalities: ["data", "text"],
    streaming_supported: true,
    icon: "FileSpreadsheet",
  },
];

/** Icon mapping by name */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Bot,
  Code,
  Languages,
  PenTool,
  Eye,
  ImagePlus,
  ScanLine,
  Mic,
  Volume2,
  BarChart3,
  FileSearch,
  BookOpen,
  FileText,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
};

/** Component props interface */
interface AgentTypeSelectorProps {
  /** Currently selected agent type */
  value?: AgentTypeValue | null;
  /** Callback when selection changes */
  onChange?: (agentType: AgentTypeValue) => void;
  /** Whether to show all categories expanded by default */
  expandAll?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether disabled */
  disabled?: boolean;
  /** Compact mode for inline usage */
  compact?: boolean;
}

/**
 * Agent type selector component displaying 18 agent types in categories
 *
 * Features:
 * - Categorized grid layout (Chat/Vision/Audio/Document/Data)
 * - Visual icons and descriptions per agent
 * - Streaming support indicators
 * - Fallback to default definitions when API unavailable
 *
 * @param props - Component properties
 * @returns JSX element
 */
export function AgentTypeSelector({
  value,
  onChange,
  expandAll = false,
  className = "",
  disabled = false,
  compact = false,
}: AgentTypeSelectorProps) {
  const [agents, setAgents] = useState<AgentListItem[]>(DEFAULT_AGENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<AgentCategory>>(
    expandAll ? new Set(["chat", "vision", "audio", "document", "data"]) : new Set(["chat"])
  );

  /**
   * Load available agents from API on mount
   */
  useEffect(() => {
    async function loadAgents() {
      try {
        setIsLoading(true);
        const { multimodalApi } = await import("@/lib/api_client");
        const result = await multimodalApi.listAgents();
        if (result.agents?.length > 0) {
          setAgents(result.agents);
        }
      } catch {
        /* Use default agents as fallback */
      } finally {
        setIsLoading(false);
      }
    }

    loadAgents();
  }, []);

  /**
   * Toggle category expansion
   */
  const toggleCategory = useCallback((category: AgentCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  /**
   * Handle agent selection
   */
  const handleSelect = useCallback(
    (agentType: AgentTypeValue) => {
      if (!disabled) {
        onChange?.(agentType);
      }
    },
    [disabled, onChange]
  );

  /** Group agents by category */
  const groupedAgents = agents.reduce<Record<AgentCategory, AgentListItem[]>>(
    (acc, agent) => {
      if (!acc[agent.category]) acc[agent.category] = [];
      acc[agent.category].push(agent);
      return acc;
    },
    {} as Record<AgentCategory, AgentListItem[]>
  );

  if (compact) {
    return (
      <div className={className}>
        <select
          value={value || "auto"}
          onChange={(e) => handleSelect(e.target.value as AgentTypeValue)}
          disabled={disabled}
          aria-label="Select agent type"
          title="Select agent type"
          className="h-11 w-full rounded-none border border-border bg-background px-4 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
        >
          <option value="auto">Auto-detect</option>
          {agents.map((agent) => (
            <option key={agent.agent_id} value={agent.type}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-100 dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <Loader2 className="h-10 w-10 animate-spin text-slate-900 dark:text-white mb-4" />
          <span className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">正在加载 Agent 数据...</span>
        </div>
      )}

      {(Object.keys(CATEGORY_CONFIG) as AgentCategory[]).map((category) => {
        const config = CATEGORY_CONFIG[category];
        const CategoryIcon = config.icon;
        const isExpanded = expandedCategories.has(category);
        const categoryAgents = groupedAgents[category] || [];

        if (categoryAgents.length === 0) return null;

        return (
          <div key={category} className="border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-950 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] overflow-hidden">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b-2 border-slate-900 dark:border-white last:border-b-0"
              aria-expanded={isExpanded}
              aria-label={`${config.label} category (${categoryAgents.length} agents)`}
            >
              <div className={`p-2 border-2 border-slate-900 dark:border-white shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff] ${config.bgColorClass.replace("/10", "")}`}>
                <CategoryIcon className={`h-5 w-5 ${config.textColorClass.replace("text-", "text-slate-900 dark:text-").replace("-600", "-900")}`} />
              </div>
              <span className="flex-1 text-base font-black uppercase tracking-widest text-left text-slate-900 dark:text-white">
                {config.label}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-0.5 border-2 border-slate-900 dark:border-white">
                {categoryAgents.length}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-slate-900 dark:text-white transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Agent grid */}
            {isExpanded && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-950">
                {categoryAgents.map((agent) => {
                  const isSelected = value === agent.type;
                  const IconComponent = ICON_MAP[agent.icon || "Bot"] || Bot;

                  return (
                    <button
                      key={agent.agent_id}
                      type="button"
                      onClick={() => handleSelect(agent.type)}
                      disabled={disabled}
                      className={`group flex items-start gap-3 p-4 border-2 border-slate-900 dark:border-white transition-all text-left ${
                        isSelected
                          ? `bg-slate-50 dark:bg-cyan-600 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] translate-x-[-2px] translate-y-[-2px]`
                          : "bg-slate-50 dark:bg-slate-900 shadow-[4px_4px_0px_0px_#0f172a] dark:shadow-[4px_4px_0px_0px_#ffffff] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#0f172a] dark:hover:shadow-[6px_6px_0px_0px_#ffffff]"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"}`}
                      aria-label={`Select ${agent.name}`}
                      title={agent.description}
                    >
                      <div className={`p-2 border-2 border-slate-900 dark:border-white bg-white dark:bg-slate-800 shadow-[2px_2px_0px_0px_#0f172a] dark:shadow-[2px_2px_0px_0px_#ffffff]`}>
                        <IconComponent
                          className={`h-6 w-6 shrink-0 text-slate-900 dark:text-white`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-base font-black uppercase tracking-wide truncate text-slate-900 dark:text-white`}
                        >
                          {agent.name}
                        </p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 line-clamp-1 uppercase">
                          {agent.description}
                        </p>

                        {/* Modality badges */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          {agent.input_modalities.slice(0, 3).map((modality) => (
                            <span
                              key={modality}
                              className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-slate-900 dark:border-white bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white`}
                            >
                              {modality}
                            </span>
                          ))}
                          {agent.streaming_supported && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase border-2 border-slate-900 dark:border-white bg-slate-100 dark:bg-emerald-600 text-slate-900 dark:text-white">
                              <Sparkles className="h-3 w-3" />
                              STREAM
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
