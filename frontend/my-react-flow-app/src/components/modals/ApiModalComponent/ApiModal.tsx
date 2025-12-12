import React, { useState, useEffect, useRef } from 'react';
import { ModalBase } from '../ModalBaseComponent/ModalBase';
import styles from './styles.module.scss';

interface ApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialUrl: string;
  initialMethod: string;
  onSave: (nodeId: string, url: string, method: string, responseStatus?: number | null, responseData?: any) => void;
  connectedPromptText?: string;
}

export const ApiModal: React.FC<ApiModalProps> = ({ 
  isOpen, 
  onClose, 
  nodeId, 
  initialUrl, 
  initialMethod, 
  onSave,
  connectedPromptText 
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [method, setMethod] = useState(initialMethod);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const [usePromptInBody, setUsePromptInBody] = useState<boolean>(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const requestBodyRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setMethod(initialMethod);
      setIsLoading(false);
      setResponse(null);
      setResponseStatus(null);
      setError(null);
      setRequestBody('');
      setUsePromptInBody(!!connectedPromptText);
      
      if (connectedPromptText && !requestBody.includes(connectedPromptText)) {
        setRequestBody(JSON.stringify({ prompt: connectedPromptText }, null, 2));
      }
      
      setTimeout(() => {
        if (urlInputRef.current) {
          urlInputRef.current.focus();
          urlInputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, initialUrl, initialMethod, connectedPromptText]);
  
  const handleSendRequest = async () => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }
    
    let validatedUrl = url.trim();
    if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
      validatedUrl = 'https://' + validatedUrl;
      setUrl(validatedUrl);
    }
    
    try {
      setIsLoading(true);
      setResponse(null);
      setResponseStatus(null);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const requestOptions: RequestInit = {
          method,
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        };
        
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          (requestOptions.headers as any)['Content-Type'] = 'application/json';
          if (requestBody.trim()) {
            try {
              JSON.parse(requestBody);
              requestOptions.body = requestBody;
            } catch {
              (requestOptions.headers as any)['Content-Type'] = 'text/plain';
              requestOptions.body = requestBody;
            }
          } else if (usePromptInBody && connectedPromptText) {
            requestOptions.body = JSON.stringify({ prompt: connectedPromptText });
          }
        } else if (method === 'GET' && connectedPromptText && usePromptInBody) {
          const urlObj = new URL(validatedUrl);
          urlObj.searchParams.set('prompt', connectedPromptText);
          validatedUrl = urlObj.toString();
        }
        
        const response = await fetch(validatedUrl, requestOptions);
        clearTimeout(timeoutId);
        
        const status = response.status;
        setResponseStatus(status);
        
        const text = await response.text();
        
        let formattedResponse = text;
        try {
          if (text) {
            const json = JSON.parse(text);
              formattedResponse = JSON.stringify(json, null, 2);
          }
        } catch {
          // Not JSON, leave as is
        }
        
        setResponse(formattedResponse || 'Empty response');
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            throw new Error('Request timeout: The request took too long (15 seconds)');
          } else if (fetchError.name === 'TypeError') {
            if (fetchError.message.includes('Failed to fetch')) {
              throw new Error('Network error: Failed to fetch. Possible CORS issue or network failure.');
            }
            throw fetchError;
          } else {
            throw fetchError;
          }
        }
        throw new Error('Unknown fetch error');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Error: ${errorMessage}`);
      setResponseStatus(0);
      
      setResponse(`Failed to fetch. Details: ${errorMessage}\n\nURL: ${url}\nMethod: ${method}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = () => {
    if (nodeId) {
      onSave(nodeId, url, method, responseStatus, response);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };
  
  if (!isOpen || !nodeId) return null;
  
  const getStatusColor = (status: number | null) => {
    if (status === 0) return 'crimson';
    if (status !== null && status >= 200 && status < 300) return 'forestgreen';
    if (status !== null && status >= 300 && status < 400) return 'darkorange';
    if (status !== null && status >= 400) return 'crimson';
    return 'dimgray';
  };

  const getStatusBackground = (status: number | null) => {
    if (status === 0) return 'mistyrose';
    if (status !== null && status >= 200 && status < 300) return 'honeydew';
    if (status !== null && status >= 300 && status < 400) return 'seashell';
    if (status !== null && status >= 400) return 'mistyrose';
    return 'whitesmoke';
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="API Request Configuration"
      titleColor="forestgreen"
      maxWidth="1000px"
    >
      {connectedPromptText && (
        <div className={styles.connectedPromptSection}>
          <div className={styles.promptTitle}>
            Connected Prompt Text:
          </div>
          <div className={`${styles.promptText} modal-scrollbar`}>
            {connectedPromptText}
          </div>
          <div className={styles.promptCheckbox}>
            <input
              type="checkbox"
              id="usePrompt"
              checked={usePromptInBody}
              onChange={(e) => setUsePromptInBody(e.target.checked)}
            />
            <label htmlFor="usePrompt">
              Use this prompt in the request
            </label>
          </div>
        </div>
      )}
      
      <div className={styles.gridContainer}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            HTTP Method:
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={styles.selectInput}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            URL Endpoint:
          </label>
          <input
            ref={urlInputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://api.example.com/endpoint"
            className={styles.urlInput}
          />
        </div>
      </div>
      
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Request Body (JSON):
          </label>
          <textarea
            ref={requestBodyRef}
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter JSON request body..."
            className={styles.textarea}
          />
        </div>
      )}
      
      <div className={styles.buttonGroup}>
        <button
          onClick={handleSendRequest}
          disabled={isLoading || !url.trim()}
          className={`${styles.sendButton} ${isLoading || !url.trim() ? styles.disabled : ''}`}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner} />
              Sending Request...
            </>
          ) : 'Test Request'}
        </button>
        
        <button
          onClick={handleSave}
          className={styles.saveButton}
        >
          Save API Configuration
        </button>
      </div>
      
      {error && (
        <div className={styles.errorSection}>
          <div className={styles.errorHeader}>
            <span className={styles.errorTitle}>Error:</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        </div>
      )}
      
      {(response !== null || responseStatus !== null) && (
        <div className={styles.responseSection}>
          <div className={styles.responseHeader}>
            <h4 className={styles.responseTitle}>Response:</h4>
            <div className={styles.responseInfo}>
              <span 
                className={styles.statusBadge}
                style={{
                  backgroundColor: getStatusBackground(responseStatus),
                  color: getStatusColor(responseStatus),
                }}
              >
                {responseStatus === 0 ? 'Network Error' : 
                 responseStatus !== null ? `Status: ${responseStatus}` : 'No Status'}
              </span>
              {response && (
                <span className={styles.responseSize}>
                  {response.length > 1000 ? `${Math.ceil(response.length / 1000)}KB` : `${response.length} chars`}
                </span>
              )}
            </div>
          </div>
          
          <div className={styles.responseContainer}>
            <pre 
              className={`${styles.responseContent} api-response-scrollbar`}
              style={{
                backgroundColor: responseStatus === 0 ? 'lavenderblush' : 'whitesmoke',
              }}
            >
              {response || 'No response body'}
            </pre>
          </div>
        </div>
      )}
    </ModalBase>
  );
};