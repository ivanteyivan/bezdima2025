import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ApiNodeData } from '../../../types';
import styles from './styles.module.scss';

interface ApiNodeProps {
  id: string;
  data: ApiNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenApiModal?: (nodeId: string, currentUrl: string, currentMethod: string) => void;
}

export const ApiNode: React.FC<ApiNodeProps> = ({ id, data, selected, onOpenApiModal }) => {
  const handleClick = () => {
    if (onOpenApiModal) {
      onOpenApiModal(id, data.url || '', data.method || 'GET');
    }
  };
  
  const getStatusBackground = (status: number | null | undefined) => {
    if (status === 0) return 'mistyrose';
    if (status !== null && status !== undefined && status >= 200 && status < 300) return 'honeydew';
    if (status !== null && status !== undefined && status >= 300 && status < 400) return 'seashell';
    if (status !== null && status !== undefined && status >= 400) return 'lavenderblush';
    return 'whitesmoke';
  };

  const getStatusColor = (status: number | null | undefined) => {
    if (status === 0) return 'crimson';
    if (status !== null && status !== undefined && status >= 200 && status < 300) return 'forestgreen';
    if (status !== null && status !== undefined && status >= 300 && status < 400) return 'darkorange';
    if (status !== null && status !== undefined && status >= 400) return 'crimson';
    return 'dimgray';
  };

  const getStatusBorder = (status: number | null | undefined) => {
    if (status === 0) return 'coral';
    if (status !== null && status !== undefined && status >= 200 && status < 300) return 'limegreen';
    if (status !== null && status !== undefined && status >= 300 && status < 400) return 'orange';
    if (status !== null && status !== undefined && status >= 400) return 'coral';
    return 'silver';
  };
  
  return (
    <div
      className={`${styles.apiNode} ${selected ? styles.selected : ''}`}
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
          API
        </div>
        <div className={styles.title}>
          API Node
        </div>
      </div>
      
      <div className={styles.content}>
        {data.url ? (
          <>
            <div><strong>URL:</strong> {data.url.length > 30 ? data.url.substring(0, 30) + '...' : data.url}</div>
            <div><strong>Method:</strong> {data.method || 'GET'}</div>
          </>
        ) : (
          'Click to configure API'
        )}
      </div>
      
      {data.responseStatus !== undefined && data.responseStatus !== null && (
        <div 
          className={styles.status}
          style={{
            backgroundColor: getStatusBackground(data.responseStatus),
            color: getStatusColor(data.responseStatus),
            borderLeft: `3px solid ${getStatusBorder(data.responseStatus)}`,
          }}
        >
          Status: {data.responseStatus === 0 ? 'Network Error' : data.responseStatus}
        </div>
      )}
      
      {data.responseData && (
        <div className={styles.response}>
          <strong>Response:</strong> {typeof data.responseData === 'string' 
            ? (data.responseData.length > 50 ? data.responseData.substring(0, 50) + '...' : data.responseData)
            : 'Data received'}
        </div>
      )}
      
      <div className={styles.id}>
        ID: {id}
      </div>
    </div>
  );
};