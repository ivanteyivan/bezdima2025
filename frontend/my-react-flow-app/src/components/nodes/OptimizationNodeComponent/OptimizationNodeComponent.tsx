import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { OptimizationNodeData } from '../../../types';
import styles from './styles.module.scss';

interface OptimizationNodeComponentProps {
  id: string;
  data: OptimizationNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenOptimizationModal?: (nodeId: string, currentData: OptimizationNodeData) => void;
}

export const OptimizationNodeComponent: React.FC<OptimizationNodeComponentProps> = ({ 
  id, 
  data, 
  selected, 
  onOpenOptimizationModal 
}) => {
  const handleClick = () => {
    if (onOpenOptimizationModal) {
      onOpenOptimizationModal(id, data);
    }
  };

  const testCases = data.test_cases || [];
  const hasTests = testCases.length > 0;
  const hasResults = !!(data.raw_result || data.result || data.preview || data.lastRunAt);
  
  return (
    <div
      className={`${styles.optimizationNode} ${selected ? styles.selected : ''}`}
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
          O
        </div>
        <div className={styles.title}>
          Optimization
        </div>
        {hasResults && (
          <div className={styles.resultsBadge}>Results</div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.smallDescription}>
          {hasTests ? `Тестов: ${testCases.length}` : 'Click to configure optimization...'}
        </div>
      </div>
      
      <div className={styles.idLabel}>
        ID: {id}
      </div>
    </div>
  );
};