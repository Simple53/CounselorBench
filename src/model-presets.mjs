export const modelPresets = [
  { id: "custom", label: "自定义兼容 API", endpoint: "", model: "" },
  {
    id: "ollama",
    label: "Ollama（本地标准 · Qwen2.5-3B）",
    endpoint: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:3b",
  },
  {
    id: "ollama-lite",
    label: "Ollama（本地CPU轻量 · Qwen2.5-1.5B）",
    endpoint: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:1.5b",
  },
  {
    id: "lmstudio",
    label: "LM Studio（本地）",
    endpoint: "http://127.0.0.1:1234/v1",
    model: "qwen2.5-3b-instruct",
  },
  {
    id: "llamacpp",
    label: "llama.cpp（本地CPU极速 · GGUF）",
    endpoint: "http://127.0.0.1:8080/v1",
    model: "qwen2.5-1.5b-instruct-q4_k_m",
  },
  {
    id: "localai",
    label: "LocalAI（本地）",
    endpoint: "http://127.0.0.1:8080/v1",
    model: "",
  },
  {
    id: "vllm",
    label: "vLLM（本地）",
    endpoint: "http://127.0.0.1:8000/v1",
    model: "",
  },
  {
    id: "openai",
    label: "OpenAI 兼容",
    endpoint: "https://api.openai.com/v1",
    model: "",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    endpoint: "https://api.deepseek.com",
    model: "",
  },
];
