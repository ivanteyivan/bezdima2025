import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AgentMessage, ADKChatResponse } from '../../types';
import { showToast } from '../../utils/toast';
import agentService from '../../services/agentService';
import styles from './styles.module.scss';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertGraph?: (g: any) => void;
  useAdk?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose, onInsertGraph, useAdk = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Привет! Я ваш помощник. Чем могу помочь?', sender: 'bot', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: '2', text: 'Этот инструмент позволяет создавать визуальные workflow с нодами промптов и API запросов. Вы можете строить сложные цепочки обработки данных.', sender: 'bot', timestamp: new Date(Date.now() - 1000 * 60 * 1) },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [lastAdkGraph, setLastAdkGraph] = useState<any | null>(null);
  const lastFetchedGraphSessionKeyRef = React.useRef<string | null>(null);
  const [, setLastFetchedGraphSessionKey] = useState<string | null>(null);
  const [steps, setSteps] = useState<string[] | null>(null);
  const [retrievalSources, setRetrievalSources] = useState<string[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [adkMode, setAdkMode] = useState<boolean>(useAdk || false);
  const [streamEnabled, setStreamEnabled] = useState<boolean>(false);
  useEffect(() => setAdkMode(useAdk || false), [useAdk]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setSteps(null);
    setRetrievalSources(null);
    setLastAdkGraph(null);
    try {
      // Create history for the API from messages
      const history: AgentMessage[] = [...messages, newUserMessage].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
      if (streamEnabled) {
        setIsLoading(true);
        const botId = `bot-${Date.now()}`;
        setMessages(prev => [...prev, { id: botId, text: '', sender: 'bot', timestamp: new Date() }]);
        const { cancel } = agentService.streamMessage({ message: inputText, history, useAdk: adkMode, session_id: sessionId }, {
          onChunk: (chunk) => {
            setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: (m.text || '') + chunk } : m));
          },
            onMeta: (meta) => {
            if (meta?.session_id) setSessionId(meta.session_id);
            if (meta?.graph) {
              // If agent provided the graph inline, use it and don't fetch
              setLastAdkGraph(meta.graph);
              if (onInsertGraph) onInsertGraph(meta.graph);
              // If the agent provided a graph but no textual content, ensure the bot message shows something
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: (m.text && m.text.trim()) ? m.text : 'Готово — граф создан' } : m));
            }
            // support server-saved graph: fetch by session key only when agent didn't emit the graph inline
            if (meta?.graph_saved && meta?.graph_session_key && !meta?.graph) {
              const sk = meta.graph_session_key;
              // avoid duplicate fetches for same session key; use ref to prevent race conditions
              if (sk && lastFetchedGraphSessionKeyRef.current !== sk) {
                lastFetchedGraphSessionKeyRef.current = sk;
                setLastFetchedGraphSessionKey(sk);
                import('../../api').then(api => api.getAdkGraph(sk)).then(res => {
                  if (res?.graph && onInsertGraph) onInsertGraph(res.graph);
                }).catch(() => {});
              }
            }
            if (meta?.steps) setSteps(meta.steps);
            if (meta?.retrieval_sources) setRetrievalSources(meta.retrieval_sources);
            if (meta?.done) {
              // If the bot message is empty (no content chunks were sent), insert a default message
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: (m.text && m.text.trim()) ? m.text : 'Готово — граф создан' } : m));
              setIsLoading(false);
            }
          },
          onError: (err) => {
            showToast('Stream error: ' + (err?.message || String(err)), 'error');
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(true);
        const res = await agentService.sendMessage({ message: inputText, history, useAdk: adkMode, session_id: sessionId });
        const responseText = (res as ADKChatResponse | any).answer || 'No response';
        setMessages(prev => [...prev, { id: Date.now().toString(), text: responseText, sender: 'bot', timestamp: new Date() }]);
        if ((res as ADKChatResponse)?.session_id) setSessionId((res as ADKChatResponse).session_id);
        if ((res as ADKChatResponse)?.graph) setLastAdkGraph((res as ADKChatResponse).graph);
        if ((res as any)?.steps) setSteps((res as any).steps || null);
        if ((res as any)?.retrieval_sources) setRetrievalSources((res as any).retrieval_sources || null);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error: ' + (err?.message || String(err)), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>AI Ассистент</div>
          <div className={styles.subtitle}>Онлайн • Готов помочь</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'white' }}>
            <input type="checkbox" checked={adkMode} onChange={(e) => setAdkMode(e.target.checked)} /> ADK
          </label>
          <label style={{ fontSize: 12, color: 'white' }}>
            <input type="checkbox" checked={streamEnabled} onChange={(e) => setStreamEnabled(e.target.checked)} /> Stream
          </label>
          {sessionId && (
            <button
              style={{ fontSize: 12, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 6px', borderRadius: 4 }}
              onClick={async () => {
                try {
                  const api = await import('../../api');
                  await api.resetAdkGraph(sessionId, true);
                  showToast('Session graph reset', 'success');
                  setLastAdkGraph(null);
                  lastFetchedGraphSessionKeyRef.current = null;
                } catch (err) {
                  showToast('Failed to reset session', 'error');
                }
              }}
            >
              New Graph
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className={styles.closeButton}
        >
          ×
        </button>
      </div>

      <div className={`${styles.messagesContainer} ${styles.chatScrollbar}`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${message.sender === 'user' ? styles.userMessage : styles.botMessage}`}
          >
            <div className={styles.messageBubble}>
              {message.text}
            </div>
            <div className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {steps && (
        <div className={styles.hint}>
          <strong>Steps:</strong>
          <ul>
            {steps.map((s, idx) => <li key={idx}>{s}</li>)}
          </ul>
        </div>
      )}
      {retrievalSources && retrievalSources.length > 0 && (
        <div className={styles.hint}>
          <strong>Sources:</strong>
          <ul>
            {retrievalSources.map((s, idx) => <li key={idx}>{s}</li>)}
          </ul>
        </div>
      )}

      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className={styles.textarea}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className={`${styles.sendButton} ${!inputText.trim() ? styles.disabled : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div className={styles.footer}>
          {isLoading ? 'AI is typing...' : 'AI Chat'}
          {lastAdkGraph && onInsertGraph && (
            <button
              onClick={() => onInsertGraph(lastAdkGraph)}
              className={styles.generateButton}
            >
              Insert Graph
            </button>
          )}
        </div>
      </div>
    </div>
  );
};