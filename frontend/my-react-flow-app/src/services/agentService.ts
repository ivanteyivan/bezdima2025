import { agentChat, adkChat, agentChatStream, adkChatStream } from '../api';
import { AgentStreamEvent } from '../types';

export type StreamHandlers = {
  onChunk: (s: string) => void;
  onMeta?: (m: any) => void;
  onError?: (e: any) => void;
};

export async function sendMessage({ message, history, useAdk = false, session_id }: { message: string; history?: any[]; useAdk?: boolean; session_id?: string }) {
  if (useAdk) {
    return adkChat({ message, history, session_id });
  }
  return agentChat({ message, history });
}

export function streamMessage({ message, history, useAdk = false, session_id }: { message: string; history?: any[]; useAdk?: boolean; session_id?: string }, handlers: StreamHandlers) {
  if (useAdk) {
    return adkChatStream({ message, session_id, history }, handlers.onChunk, handlers.onMeta, handlers.onError);
  }
  return agentChatStream({ message, history }, handlers.onChunk, handlers.onMeta, handlers.onError);
}

export default { sendMessage, streamMessage };
