import React, { useState, useEffect, useRef } from 'react';
import { ModalBase } from '../ModalBaseComponent/ModalBase';
import styles from './styles.module.scss';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialPrompt: string;
  onSave: (nodeId: string, prompt: string) => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ 
  isOpen, 
  onClose, 
  nodeId, 
  initialPrompt, 
  onSave 
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, initialPrompt]);
  
  const handleSave = () => {
    if (nodeId) {
      onSave(nodeId, prompt);
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
  
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Prompt"
      titleColor="darkslategray"
      maxWidth="600px"
    >
      <div className={styles.container}>
        <label className={styles.label}>
          Prompt Text:
        </label>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          onKeyDown={handleKeyDown}
          className={styles.textarea}
        />
      </div>
      
      <div className={styles.buttonContainer}>
        <button
          onClick={handleSave}
          disabled={!prompt.trim()}
          className={`${styles.saveButton} ${!prompt.trim() ? styles.disabled : ''}`}
        >
          Save Prompt
        </button>
      </div>
    </ModalBase>
  );
};