import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileDownloadNodeData } from '../../../types';
// @ts-ignore - css modules
import styles from './styles.module.scss';

interface FileDownloadNodeComponentProps {
  id: string;
  data: FileDownloadNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onUpdateNodeData?: (nodeId: string, data: Partial<FileDownloadNodeData>) => void;
}

export const FileDownloadNodeComponent: React.FC<FileDownloadNodeComponentProps> = ({
  id,
  data,
  selected,
  onUpdateNodeData
}) => {
  const handleDownload = () => {
    if (!data.payload) return;
    const blob = new Blob([data.payload], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tests.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${styles.fileDownloadNode} ${selected ? styles.selected : ''}`} onClick={handleDownload}>
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
        <div className={styles.icon}>DL</div>
        <div className={styles.title}>Test Download</div>
      </div>

      <div className={styles.content}>
        <div className={styles.metaHint}>Click to download the result</div>
      </div>

      {data.generatedAt && (
        <div className={styles.meta}>Generated at: {new Date(data.generatedAt).toLocaleString()}</div>
      )}

      <div className={styles.idLabel}>ID: {id}</div>
    </div>
  );
};