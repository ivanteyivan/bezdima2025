import React from 'react';
import { Handle, Position } from '@xyflow/react';
import styles from './styles.module.scss';

interface StartNodeProps {
  id: string;
  data: any;
  isConnectable: boolean;
  selected?: boolean;
}

export const StartNode: React.FC<StartNodeProps> = ({ id, selected }) => {
  return (
    <div className={`${styles.startNode} ${selected ? styles.selected : ''}`}>
      <Handle
        type="source"
        position={Position.Right}
        className={`${styles.handle} ${styles.handleRight}`}
        isConnectable={true}
      />
      
      <div className={styles.content}>
        <div className={styles.label}>
          START
        </div>
        <div className={styles.id}>
          ID: {id.slice(0, 4)}
        </div>
      </div>
    </div>
  );
};