import React from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './styles.module.scss';

interface EndNodeProps {
  id: string;
  data: any;
  isConnectable: boolean;
  selected?: boolean;
}

export const EndNode: React.FC<EndNodeProps> = ({ id, selected }) => {
  return (
    <div className={`${styles.endNode} ${selected ? styles.selected : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={`${styles.handle} ${styles.handleLeft}`}
        isConnectable={true}
      />
      
      <div className={styles.content}>
        <div className={styles.label}>
          END
        </div>
        <div className={styles.id}>
          ID: {id.slice(0, 4)}
        </div>
      </div>
    </div>
  );
};