/**
 * agent_en.ts
 * Author: wuhao
 * Date: 2026-05-04
 * Description: English translations for Agent components
 */

export const agentTranslations = {
  // Tabs
  tabs: {
    chat: "Chat",
    image: "Image Gen",
    video: "Video Gen",
    music: "Music Gen",
  },

  // Chat Panel
  chatPanel: {
    newConversation: "New Conversation",
    unnamedConversation: "Unnamed Conversation",
    historyTitle: "History",
    newChat: "New Chat",
    hideHistory: "Hide History",
    showHistory: "Show History",
    hideGallery: "Hide Gallery",
    showGallery: "Show Gallery",
    inputPlaceholder: "Type a message...",
    imagePlaceholder: "Describe the image you want...",
    videoPlaceholder: "Describe the video you want...",
    musicPlaceholder: "Describe the music style...",
    sendButton: "Send",
    stopButton: "Stop Response",
    abortResponse: "Abort Response",

    // Image Generation
    imageGenTitle: "AI Creative Drawing",
    imageGenDesc: "Enter a description, AI creates beautiful images",
    tryPrompts: "Try these prompts",
    promptPortrait: "A refined Asian woman, soft natural light, ultra-high resolution, 8K quality",
    promptLandscape: "Majestic mountain sunrise, rolling sea of clouds, aerial view, HDR cinematic",
    promptCyberpunk: "Neon-lit streets, rainy night, reflective light and shadow, cyberpunk style, cinematic",
    promptAnime: "Girl under cherry blossoms, Miyazaki style, warm tones, hand-drawn texture",
    generateImage: "Generate Image",
    generating: "Generating...",

    // Video Generation
    videoGenTitle: "AI Video Synthesis",
    videoGenDesc: "Describe the scene, AI generates movie-quality videos",
    generateVideo: "Generate Video",
    generatingVideo: "Creating video...",

    // Music Generation
    musicGenTitle: "AI Music Creation",
    musicGenDesc: "Describe the style, AI creates original music",
    generateMusic: "Generate Music",
    generatingMusic: "Composing music...",
    completed: "Completed",
    clickToPlay: "Click to play",
    aiCreatedMusic: "AI Created Music",
    copyLink: "Copy Link",
    download: "Download",
    composingMelody: "Composing melody...",

    // Tab Descriptions
    tabDescriptions: {
      chat: "Chat with AI assistant, supports image upload and tool calling.",
      image: "Describe your desired scene, AI will generate beautiful images for you.",
      video: "Provide video description or reference images, start cinematic AI video creation.",
      music: "Input lyrics or style descriptions, create your own AI music.",
    },

    // Tips
    tips: {
      streaming: "Streaming output enabled",
      markdownSupported: "Markdown supported",
      dragFiles: "Drag & drop files here, or click to browse",
      selectAgent: "Select Agent type",
      errorOccurred: "An error occurred",
      dismissError: "Dismiss error",
    },
  },

  // Agent Type Selector
  agentTypes: {
    title: "Agent Types",
    autoDetect: "Auto-detect",
    loadingAgents: "Loading agents...",
    categories: {
      chat: "Chat & Assistant",
      vision: "Vision & Image",
      audio: "Audio & Speech",
      document: "Document & PDF",
      data: "Data & Analysis",
    },
    agents: {
      chat: {
        name: "General Chat",
        desc: "Multi-turn conversation assistant",
      },
      code_assistant: {
        name: "Code Assistant",
        desc: "Programming and debugging helper",
      },
      translator: {
        name: "Translator",
        desc: "Multi-language translation expert",
      },
      writer: {
        name: "Writer",
        desc: "Content creation assistant",
      },
      vision: {
        name: "Vision Analyzer",
        desc: "Image understanding and analysis",
      },
      image_generator: {
        name: "Image Generator",
        desc: "AI image creation (DALL-E)",
      },
      ocr_agent: {
        name: "OCR Scanner",
        desc: "Text extraction from images",
      },
      speech_to_text: {
        name: "Speech to Text",
        desc: "Voice transcription (Whisper)",
      },
      text_to_speech: {
        name: "Text to Speech",
        desc: "Natural voice synthesis",
      },
      pdf_parser: {
        name: "PDF Parser",
        desc: "Document text extraction",
      },
      document_qa: {
        name: "Document QA",
        desc: "Q&A on documents",
      },
      summarizer: {
        name: "Summarizer",
        desc: "Content summarization",
      },
      data_analyst: {
        name: "Data Analyst",
        desc: "Data analysis and insights",
      },
      chart_generator: {
        name: "Chart Generator",
        desc: "Visual chart creation",
      },
      excel_processor: {
        name: "Excel Processor",
        desc: "Spreadsheet data processing",
      },
      audio_analyzer: {
        name: "Audio Analyzer",
        desc: "Audio feature analysis",
      },
      image_editor: {
        name: "Image Editor",
        desc: "Image editing and enhancement",
      },
      web_searcher: {
        name: "Web Searcher",
        desc: "Real-time web search",
      },
    },
  },

  // Multimodal Upload
  upload: {
    dropzoneText: "Drag & drop files here, or click to browse",
    supportedFormats: "Supported:",
    maxSize: "Max {size}MB each",
    filesSelected: "{count} file(s) selected",
    clearAll: "Clear All",
    removeFile: "Remove file",
    dismissError: "Dismiss error",
    invalidFileType: "Invalid file type",
    fileSizeExceeded: "File size exceeded limit",
    types: {
      image: "Image",
      audio: "Audio",
      pdf: "PDF",
    },
  },

  // WebSocket Status
  websocket: {
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Error",
    reconnecting: "Reconnecting...",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
  },

  // Errors
  errors: {
    sendFailed: "Failed to send message",
    requestFailed: "Request failed",
    rateLimited: "Request too frequent, please try again later",
    networkError: "Network connection failed",
    serverError: "Server error occurred",
    unauthorized: "Authentication required",
    quotaExceeded: "Free quota exhausted",
  },
};

export type AgentTranslationKeys = keyof typeof agentTranslations;
