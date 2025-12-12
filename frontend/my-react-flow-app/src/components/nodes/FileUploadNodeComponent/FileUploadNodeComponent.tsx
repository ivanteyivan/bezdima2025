import React, { useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileUploadNodeData } from '../../../types';
// @ts-ignore - css modules
import styles from './styles.module.scss';

interface FileUploadNodeComponentProps {
  id: string;
  data: FileUploadNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onUpdateNodeData?: (nodeId: string, data: Partial<FileUploadNodeData>) => void;
}

export const FileUploadNodeComponent: React.FC<FileUploadNodeComponentProps> = ({
  id,
  data,
  selected,
  onUpdateNodeData
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePickFile = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateNodeData?.(id, {
        fileName: file.name,
        fileContent: reader.result as string,
        preview: (reader.result as string)?.slice(0, 500),
        uploadedAt: new Date().toISOString()
      });
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`${styles.fileUploadNode} ${selected ? styles.selected : ''}`}
      onClick={handlePickFile}
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
        <div className={styles.icon}>UP</div>
        <div className={styles.title}>Requirements Upload</div>
      </div>

      <div className={styles.content}>
        <div><strong>File:</strong> {data.fileName || 'not selected'}</div>
        <div className={styles.metaHint}>Click to select a file</div>
      </div>

      {data.uploadedAt && (
        <div className={styles.meta}>Uploaded: {new Date(data.uploadedAt).toLocaleString()}</div>
      )}

      <div className={styles.idLabel}>ID: {id}</div>

      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
    </div>
  );
};