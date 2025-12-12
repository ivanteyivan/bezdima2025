import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { AutomatedTestNodeData } from '../../../types';
import styles from './styles.module.scss';

interface AutomatedTestNodeComponentProps {
  id: string;
  data: AutomatedTestNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenAutomatedTestModal?: (nodeId: string, currentData: AutomatedTestNodeData) => void;
}

export const AutomatedTestNodeComponent: React.FC<AutomatedTestNodeComponentProps> = ({ 
  id, 
  data, 
  selected, 
  onOpenAutomatedTestModal 
}) => {
  const handleClick = () => {
    if (onOpenAutomatedTestModal) {
      onOpenAutomatedTestModal(id, data);
    }
  };
  
  return (
    <div
      className={`${styles.automatedTestNode} ${selected ? styles.selected : ''}`}
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
          A
        </div>
        <div className={styles.title}>
          Automated Test
        </div>
      </div>
      
      <div className={styles.content}>
        <div><strong>Framework:</strong> {data.framework || 'Not selected'}</div>
        {data.base_url && <div><strong>Base URL:</strong> {data.base_url}</div>}
      </div>
      
      {data.generated_code && (
        <div className={styles.codeGeneratedBadge}>
          Code generated
        </div>
      )}
      
      <div className={styles.idLabel}>
        ID: {id}
      </div>
    </div>
  );
};