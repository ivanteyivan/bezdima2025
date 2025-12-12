const rawBackend = (import.meta as any).env?.VITE_BACKEND_URL || (import.meta as any).env?.VITE_API_URL || 'https://container-testops-copilot-backend.containerapps.ru';
const BACKEND_BASE = rawBackend.startsWith('http') ? rawBackend : `https://${rawBackend}`;

const rawAgent = (import.meta as any).env?.VITE_AGENT_URL || 'http://127.0.0.1:9000';
const AGENT_BASE = rawAgent.startsWith('http') ? rawAgent : `https://${rawAgent}`;

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${BACKEND_BASE}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `Request failed with status ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export async function generateManualTest(data: {
  requirements: string;
  feature?: string;
  story?: string;
  owner?: string;
  test_type?: string;
}) {
  return request<{ code: string }>(
    `${BACKEND_BASE}/api/v1/generate-test-case`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function generateUiTests(data: {
  test_cases: string;
  requirements?: string;
  framework?: string;
}) {
  return request<{ code: string }>(
    `${BACKEND_BASE}/api/v1/generate-ui-test`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function generateApiTests(data: {
  openapi_spec: any;
  test_cases?: string;
  base_url?: string;
}) {
  return request<{ code: string }>(
    `${BACKEND_BASE}/api/v1/generate-api-test`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function generateTestCaseFromOpenapi(data: {
  spec_content?: string;
  format?: 'json' | 'yaml' | 'auto';
  url?: string;
}) {
  return request<{ code: string; success: boolean }>(
    `${BACKEND_BASE}/api/v1/generate-test-case-from-openapi`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function parseOpenapi(data: {
  spec_content?: string;
  format?: 'json' | 'yaml' | 'auto';
  url?: string;
}) {
  return request<{
    success: boolean;
    validation: any;
    endpoints: any[];
    endpoints_count: number;
    schemas: string[];
    schemas_count: number;
    security_schemes: string[];
    spec: any;
  }>(
    `${BACKEND_BASE}/api/v1/parse-openapi`,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function checkConfig() {
  return request<any>('/api/v1/check-config', { method: 'GET' });
}

export async function testLlmConnection() {
  return request<any>('/api/v1/test-llm-connection', { method: 'POST', body: JSON.stringify({}) });
}

export async function optimizeTests(data: {
  test_cases: string[];
  requirements: string;
  defect_history?: string;
}) {
  return request<{
    coverage: any;
    duplicates: any;
    improvements: any;
    success: boolean;
  }>('/api/v1/optimize', { method: 'POST', body: JSON.stringify(data) });
}

export async function checkStandards(data: { test_case?: string; test_cases?: string[] }) {
  return request<{ success: boolean; result: any }>(
    '/api/v1/check-standards',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function getIamToken(data: { key_id: string; key_secret: string }) {
  return request<{ access_token: string; expires_in?: number }>(
    '/api/v1/iam/token',
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function agentChat(data: {
  message: string;
  history?: { role: 'user' | 'assistant' | 'system'; content: string }[];
  knowledge_base?: { source?: string; text: string }[];
}) {
  const url = `${AGENT_BASE}/api/v1/agent-chat`;
  return request<{ answer: string; steps?: string[]; retrieval_sources?: string[] }>(
    url,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function adkChat(data: { message: string; session_id?: string; history?: { role: 'user' | 'assistant' | 'system'; content: string }[] }) {
  const url = `${AGENT_BASE}/api/v1/adk/chat`;
  return request<{ answer: string; session_id?: string; graph?: any; steps?: string[]; retrieval_sources?: string[] }>(
    url,
    { method: 'POST', body: JSON.stringify(data) }
  );
}

export async function getAdkGraph(session_key?: string) {
  const url = session_key ? `${AGENT_BASE}/api/v1/adk/graph?session_key=${encodeURIComponent(session_key)}` : `${AGENT_BASE}/api/v1/adk/graph`;
  return request<{ graph: any; session_key: string }>(url, { method: 'GET' });
}

export async function resetAdkGraph(session_key: string, delete_graph: boolean = false) {
  const url = `${AGENT_BASE}/api/v1/adk/graph/reset`;
  return request<any>(url, { method: 'POST', body: JSON.stringify({ session_key, delete_graph }) });
}

// Streaming helpers: POST and parse newline-delimited JSON or plain text chunks.
export function agentChatStream(
  data: { message: string; history?: { role: 'user' | 'assistant' | 'system'; content: string }[]; knowledge_base?: any[] },
  onChunk: (chunk: string) => void,
  onMeta?: (meta: any) => void,
  onError?: (err: any) => void
) {
  const controller = new AbortController();
  const url = `${BACKEND_BASE}/api/v1/agent-chat/stream`;
  const agentUrl = `${AGENT_BASE}/api/v1/agent-chat/stream`;
  (async () => {
    try {
      // prefer agent streaming endpoint
      const resp = await fetch(agentUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Request failed: ${resp.status}`);
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split(/\r?\n/);
        buf = parts.pop() || '';
        for (const part of parts) {
          if (!part) continue;
          try {
            const json = JSON.parse(part);
            if (json.content) onChunk(json.content);
            else onMeta && onMeta(json);
          } catch (e) {
            onChunk(part);
          }
        }
      }
      if (buf.trim()) {
        try {
          const json = JSON.parse(buf);
          if (json.content) onChunk(json.content);
          else onMeta && onMeta(json);
        } catch (e) {
          onChunk(buf);
        }
      }
      onMeta && onMeta({ done: true });
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      onError && onError(err);
    }
  })();
  return { cancel: () => controller.abort() };
}

export function adkChatStream(
  data: { message: string; session_id?: string; history?: { role: 'user' | 'assistant' | 'system'; content: string }[] },
  onChunk: (chunk: string) => void,
  onMeta?: (meta: any) => void,
  onError?: (err: any) => void
) {
  const controller = new AbortController();
  const url = `${AGENT_BASE}/api/v1/adk/chat/stream`;
  (async () => {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `Request failed: ${resp.status}`);
      }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split(/\r?\n/);
        buf = parts.pop() || '';
        for (const part of parts) {
          if (!part) continue;
          try {
            const json = JSON.parse(part);
            if (json.content) onChunk(json.content);
            else onMeta && onMeta(json);
          } catch (e) {
            onChunk(part);
          }
        }
      }
      if (buf.trim()) {
        try {
          const json = JSON.parse(buf);
          if (json.content) onChunk(json.content);
          else onMeta && onMeta(json);
        } catch (e) {
          onChunk(buf);
        }
      }
      onMeta && onMeta({ done: true });
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return;
      onError && onError(err);
    }
  })();
  return { cancel: () => controller.abort() };
}

