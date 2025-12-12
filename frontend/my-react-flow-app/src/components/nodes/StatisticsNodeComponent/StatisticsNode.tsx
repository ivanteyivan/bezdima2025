import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { StatisticsNodeData, TestGenerationStatistics } from '../../../types';
import styles from './styles.module.scss';

interface StatisticsNodeProps {
  id: string;
  data: StatisticsNodeData;
  isConnectable: boolean;
  selected?: boolean;
  onOpenStatisticsModal?: (nodeId: string, statistics: TestGenerationStatistics | null) => void;
}

export const StatisticsNode: React.FC<StatisticsNodeProps> = ({ 
  id, 
  data, 
  selected, 
  onOpenStatisticsModal 
}) => {
  const handleClick = () => {
    console.log('StatisticsNode clicked, id:', id);
    console.log('Data:', data);
    
    if (data.generationStatistics) {
      const stats = data.generationStatistics;
      console.log('Generation stats available:', stats);
      console.log('Total tests:', stats.totalTests);
      console.log('Test cases:', stats.testCases);
      console.log('Test cases with tags:', stats.testCases.map(tc => ({
        name: tc.name,
        tags: tc.tags,
        hasLink: tc.hasLink,
        jiraId: tc.jiraId
      })));
    } else {
      console.log('No generation statistics available');
    }
    
    if (onOpenStatisticsModal) {
      onOpenStatisticsModal(id, data.generationStatistics || null);
    } else {
      console.error('onOpenStatisticsModal is not provided!');
    }
  };

  const getPreview = () => {
    if (data.generationStatistics) {
      const stats = data.generationStatistics;
      const total = stats.totalTests || 0;
      const highPriority = stats.byPriority?.high || 0;
      const jiraLinked = stats.testCases?.filter(tc => tc.hasLink).length || 0;
      const tagsCount = Object.keys(stats.byTag || {}).length;
      
      return `${total} tests, ${highPriority} critical, ${jiraLinked} JIRA linked, ${tagsCount} tags`;
    }
    
    if (data.statistics) {
      const stats = data.statistics;
      const total = stats.total || 0;
      const passed = stats.passed || 0;
      const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      
      return `${total} tests, ${successRate}% passed`;
    }
    
    return 'Click to generate statistics';
  };

  const getStatusColor = () => {
    if (data.generationStatistics) {
      const stats = data.generationStatistics;
      const total = stats.totalTests || 0;
      const highPriority = stats.byPriority?.high || 0;
      const jiraLinked = stats.testCases?.filter(tc => tc.hasLink).length || 0;
      
      if (total > 0 && jiraLinked > 0) return '#10b981';
      if (total > 0) return '#f59e0b';
      return '#ef4444';
    }
    
    if (data.statistics) {
      const stats = data.statistics;
      const total = stats.total || 0;
      const passed = stats.passed || 0;
      const successRate = total > 0 ? (passed / total) * 100 : 0;
      
      if (successRate >= 90) return '#10b981';
      if (successRate >= 70) return '#f59e0b';
      return '#ef4444';
    }
    
    return '#6c757d';
  };

  const hasStatistics = data.generationStatistics || data.statistics;

  return (
    <div
      className={`${styles.statisticsNode} ${selected ? styles.selected : ''}`}
      onClick={handleClick}
      style={{
        borderLeftColor: getStatusColor(),
        cursor: 'pointer'
      }}
    >
      {/* Вход слева */}
      <Handle
        type="target"
        position={Position.Left}
        className={`${styles.handle} ${styles.handleLeft}`}
        isConnectable={true}
      />
      
      {/* Выход справа */}
      <Handle
        type="source"
        position={Position.Right}
        className={`${styles.handle} ${styles.handleRight}`}
        isConnectable={true}
      />
      
      <div className={styles.header}>
        <div className={styles.icon}>
          📊
        </div>
        <div className={styles.title}>
          {data.generationStatistics ? 'Test Generation Stats' : 'Statistics Node'}
        </div>
      </div>
      
      <div className={`${styles.content} ${!hasStatistics ? styles.emptyContent : ''}`}>
        {hasStatistics ? (
          <div className={styles.preview}>
            {getPreview()}
          </div>
        ) : (
          <div className={styles.placeholder}>
            Click to view statistics
          </div>
        )}
      </div>
      
      {data.generationStatistics ? (
        <div className={styles.statsSummary}>
          <div className={styles.statItem}>
            Total: {data.generationStatistics.totalTests || 0}
          </div>
          <div className={styles.statItem}>
            High: {data.generationStatistics.byPriority?.high || 0}
          </div>
          <div className={styles.statItem}>
            JIRA: {data.generationStatistics.testCases?.filter(tc => tc.hasLink).length || 0}
          </div>
        </div>
      ) : data.statistics && (
        <div className={styles.statsSummary}>
          <div className={styles.statItem}>
            P: {data.statistics.passed || 0}
          </div>
          <div className={styles.statItem}>
            F: {data.statistics.failed || 0}
          </div>
          <div className={styles.statItem}>
            S: {data.statistics.skipped || 0}
          </div>
        </div>
      )}
      
      {data.generatedAt && (
        <div className={styles.timestamp}>
          Generated: {new Date(data.generatedAt).toLocaleDateString()}
        </div>
      )}
      
      <div className={styles.idLabel}>
        ID: {id}
      </div>
    </div>
  );
};