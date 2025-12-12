import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckStandardsNodeData } from '../../../types';
import styles from './styles.module.scss';

interface CheckStandardsNodeComponentProps {
  id: string;
  data: CheckStandardsNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenCheckStandardsModal?: (nodeId: string, currentData: CheckStandardsNodeData) => void;
}

export const CheckStandardsNodeComponent: React.FC<CheckStandardsNodeComponentProps> = ({ 
  id, 
  data, 
  selected, 
  onOpenCheckStandardsModal 
}) => {
  const handleClick = () => {
    if (onOpenCheckStandardsModal) {
      onOpenCheckStandardsModal(id, data);
    }
  };
  
  return (
    <div
      className={`${styles.checkStandardsNode} ${selected ? styles.selected : ''}`}
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
          S
        </div>
        <div className={styles.title}>
          Standards
        </div>
      </div>
      
      <div className={`${styles.content} ${!data.result ? styles.emptyContent : ''}`}>
        {data.result ? (
          <div>
            <div><strong>Score:</strong> {data.result.score}/100</div>
            <div><strong>Structure:</strong> {data.result.structure ? 'Pass' : 'Fail'}</div>
            <div><strong>Decorators:</strong> {data.result.decorators ? 'Pass' : 'Fail'}</div>
          </div>
        ) : (
          <span>Click to check standards...</span>
        )}
      </div>
      
      <div className={styles.idLabel}>
        ID: {id}
      </div>
    </div>
  );
};