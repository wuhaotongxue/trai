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
  TableSpreadsheet,
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
    bgColorClass: "bg-cyan-500/10",
    textColorClass: "text-cyan-600 dark:text-cyan-400",
    borderColorClass: "border-cyan-200 dark:border-cyan-800",
  },
  document: {
    label: "Document",
    icon: FileText,
    bgColorClass: "bg-amber-500/10",
    textColorClass: "text-amber-600 dark:text-amber-400",
    borderColorClass: "border-amber-200 dark:border-amber-800",
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
    id: "chat",
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
    id: "code_assistant",
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
    id: "translator",
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
    id: "writer",
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
    id: "vision",
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
    id: "image_generator",
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
    id: "ocr_agent",
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
    id: "speech_to_text",
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
    id: "text_to_speech",
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
    id: "pdf_parser",
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
    id: "document_qa",
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
    id: "summarizer",
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
    id: "data_analyst",
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
    id: "chart_generator",
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
    id: "excel_processor",
    name: "Excel Processor",
    description: "Process spreadsheet data",
    type: "excel_processor",
    category: "data",
    input_modalities: ["data"],
    output_modalities: ["data", "text"],
    streaming_supported: true,
    icon: "TableSpreadsheet",
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
  TableSpreadsheet,
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
          className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
        >
          <option value="auto">Auto-detect</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.type}>
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
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Loading agents...</span>
        </div>
      )}

      {(Object.keys(CATEGORY_CONFIG) as AgentCategory[]).map((category) => {
        const config = CATEGORY_CONFIG[category];
        const CategoryIcon = config.icon;
        const isExpanded = expandedCategories.has(category);
        const categoryAgents = groupedAgents[category] || [];

        if (categoryAgents.length === 0) return null;

        return (
          <div key={category} className="rounded-xl border border-border overflow-hidden">
            {/* Category header */}
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
              aria-expanded={isExpanded}
              aria-label={`${config.label} category (${categoryAgents.length} agents)`}
            >
              <div className={`p-2 rounded-lg ${config.bgColorClass}`}>
                <CategoryIcon className={`h-4 w-4 ${config.textColorClass}`} />
              </div>
              <span className="flex-1 text-sm font-semibold text-left text-foreground">
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground mr-2">
                {categoryAgents.length}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Agent grid */}
            {isExpanded && (
              <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryAgents.map((agent) => {
                  const isSelected = value === agent.type;
                  const IconComponent = ICON_MAP[agent.icon || "Bot"] || Bot;

                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleSelect(agent.type)}
                      disabled={disabled}
                      className={`group flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? `${config.borderColorClass} ${config.bgColorClass} ring-1 ${config.textColorClass.replace("text-", "ring-")}`
                          : "border-transparent hover:bg-muted/50"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      aria-label={`Select ${agent.name}`}
                      title={agent.description}
                    >
                      <IconComponent
                        className={`h-5 w-5 shrink-0 mt-0.5 ${
                          isSelected ? config.textColorClass : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isSelected ? "text-foreground" : "text-foreground/80"
                          }`}
                        >
                          {agent.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {agent.description}
                        </p>

                        {/* Modality badges */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {agent.input_modalities.slice(0, 3).map((modality) => (
                            <span
                              key={modality}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bgColorClass} ${config.textColorClass}`}
                            >
                              {modality}
                            </span>
                          ))}
                          {agent.streaming_supported && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                              <Sparkles className="h-2.5 w-2.5" />
                              stream
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected indicator */}
                      {isSelected && (
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${config.bgColorClass.replace("/10", "-500")}`}
                        />
                      )}
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
