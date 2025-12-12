import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { PromptNodeData } from '../../../types';
import styles from './styles.module.scss';

interface PromptNodeProps {
  id: string;
  data: PromptNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenPromptModal?: (nodeId: string, currentPrompt: string) => void;
}

export const PromptNode: React.FC<PromptNodeProps> = ({ id, data, selected, onOpenPromptModal }) => {
  const handleClick = () => {
    if (onOpenPromptModal) {
      onOpenPromptModal(id, data.prompt || '');
    }
  };
  
  return (
    <div
      className={`${styles.promptNode} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`${styles.handle} ${styles.handleLeft}`}
        isConnectable={true}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        className={`${styles.handle} ${styles.handleRight}`}
        isConnectable={true}
      />
      
      <div className={styles.header}>
        <div className={styles.icon}>
          P
        </div>
        <div className={styles.title}>
          Prompt Node
        </div>
      </div>
      
      <div className={`${styles.content} ${!data.prompt ? styles.emptyContent : ''}`}>
        {data.prompt ? (
          data.prompt.length > 100 ? data.prompt.substring(0, 100) + '...' : data.prompt
        ) : (
          <span>Click to add prompt text...</span>
        )}
      </div>
      
      <div className={styles.idLabel}>
        ID: {id}
      </div>
    </div>
  );
};