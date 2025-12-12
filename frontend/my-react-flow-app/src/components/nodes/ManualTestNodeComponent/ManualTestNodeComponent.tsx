import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ManualTestNodeData } from '../../../types';
// @ts-ignore - css modules
import styles from './styles.module.scss';

interface ManualTestNodeComponentProps {
  id: string;
  data: ManualTestNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenManualTestModal?: (nodeId: string, currentData: ManualTestNodeData) => void;
}

export const ManualTestNodeComponent: React.FC<ManualTestNodeComponentProps> = ({ id, data, selected, onOpenManualTestModal }) => {
  const handleClick = () => {
    if (onOpenManualTestModal) {
      onOpenManualTestModal(id, data);
    }
  };

  const getPreview = () => {
    const txt = data.preview || data.requirements_text || data.requirements || data.openapi_url || '';
    if (!txt) return '';
    const trimmed = txt.trim();
    return trimmed.length > 40 ? trimmed.slice(0, 40) + '...' : trimmed;
  };
  
  return (
    <div
      className={`${styles.manualTestNode} ${selected ? styles.selected : ''}`}
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
          M
        </div>
        <div className={styles.title}>
          Manual Test
        </div>
      </div>
      
      <div className={`${styles.content} ${!data.requirements && !data.preview ? styles.emptyContent : ''}`}>
        {data.preview || data.requirements || data.requirements_text ? (
          getPreview()
        ) : (
          <span>Click to configure manual test...</span>
        )}
      </div>
      
      {data.generated_tests && (
        <div className={styles.generatedBadge}>
          Tests generated
        </div>
      )}
      
      <div className={styles.idLabel}>
        ID: {id}
      </div>
    </div>
  );
};