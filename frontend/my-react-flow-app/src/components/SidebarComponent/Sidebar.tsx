import React from 'react';
// @ts-ignore - css modules
import styles from './styles.module.scss';

interface SidebarProps {
  activeTab: any;
  nodes: any[];
  edges: any[];
  selectedNodeCount: number;
  selectedEdgeCount: number;
  copiedNodes: any[];
  hasStartNode: boolean;
  hasEndNode: boolean;
  isModalOpen: boolean;
  nodeCounter: number;
  onAddPromptNode: () => void;
  onAddApiNode: () => void;
  onAddFileUploadNode: () => void;
  onAddFileDownloadNode: () => void;
  onAddStartNode: () => void;
  onAddEndNode: () => void;
  onAddManualTestNode: () => void;
  onAddAutomatedTestNode: () => void;
  onAddOptimizationNode: () => void;
  onAddCheckStandardsNode: () => void;
  onAddStatisticsNode: () => void; // Добавьте этот пропс
  onRunFlow: () => void;
  isRunning: boolean;
  runProgress: number;
  onGetPathFromStartToEnd: () => void;
  onCopySelectedNodes: () => void;
  onPasteCopiedNodes: () => void;
  onExportState: () => void;
  onImportState: () => void;
  onResetToInitial: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  nodes,
  edges,
  selectedNodeCount,
  selectedEdgeCount,
  copiedNodes,
  hasStartNode,
  hasEndNode,
  isModalOpen,
  nodeCounter,
  onAddPromptNode,
  onAddApiNode,
  onAddFileUploadNode,
  onAddFileDownloadNode,
  onAddStartNode,
  onAddEndNode,
  onAddManualTestNode,
  onAddAutomatedTestNode,
  onAddOptimizationNode,
  onAddCheckStandardsNode,
  onAddStatisticsNode, // Добавьте этот пропс
  onRunFlow,
  isRunning,
  runProgress,
  onGetPathFromStartToEnd,
  onCopySelectedNodes,
  onPasteCopiedNodes,
  onExportState,
  onImportState,
  onResetToInitial,
}) => {
  const getButtonStyle = (baseColor: string, disabled: boolean) => {
    return {
      backgroundColor: disabled ? 'lightgray' : baseColor,
      cursor: disabled ? 'not-allowed' : 'pointer',
    };
  };

  const getHoverStyle = (baseColor: string, darkColor: string, disabled: boolean) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = darkColor;
      }
    };
  };

  const getLeaveStyle = (baseColor: string, disabled: boolean) => {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        e.currentTarget.style.backgroundColor = baseColor;
      }
    };
  };

  const promptDisabled = isModalOpen;
  const apiDisabled = isModalOpen;
  const fileUploadDisabled = isModalOpen;
  const fileDownloadDisabled = isModalOpen;
  const manualTestDisabled = isModalOpen;
  const automatedTestDisabled = isModalOpen;
  const optimizationDisabled = isModalOpen;
  const checkStandardsDisabled = isModalOpen;
  const statisticsDisabled = isModalOpen; // Добавьте эту строку
  const startDisabled = isModalOpen || hasStartNode;
  const endDisabled = isModalOpen || hasEndNode;
  const getPathDisabled = isModalOpen || !hasStartNode || !hasEndNode;
  const copyDisabled = isModalOpen;
  const pasteDisabled = copiedNodes.length === 0 || isModalOpen;
  const exportDisabled = isModalOpen;
  const importDisabled = isModalOpen;
  const resetDisabled = isModalOpen;

  return (
    <div className={`${styles.sidebarContainer} custom-scrollbar`}>
      <h1 className={styles.title}>TestOps Canvas</h1>
      
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Active Tab: {activeTab.label}</div>
        <div className={styles.stats}>
          Nodes: {nodes.length}, Edges: {edges.length}
        </div>
        <div className={styles.selectedStats}>
          Selected: {selectedNodeCount} nodes, {selectedEdgeCount} edges
        </div>
        <div className={styles.clipboardInfo}>
          <div className={styles.clipboardText}>
            In clipboard: {copiedNodes.length} nodes
          </div>
          <div className={styles.indicators}>
            {hasStartNode && (
              <span className="start-end-indicator start-indicator" title="START node exists">S</span>
            )}
            {hasEndNode && (
              <span className="start-end-indicator end-indicator" title="END node exists">E</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Run Flow:</div>
        <div className={styles.fullWidthButton}>
          <button
            onClick={onRunFlow}
            className={styles.actionButton}
            style={getButtonStyle('#0d47a1', isRunning)}
            onMouseEnter={getHoverStyle('#0d47a1', '#093170', isRunning)}
            onMouseLeave={getLeaveStyle('#0d47a1', isRunning)}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'RUN'}
          </button>
          <div className={styles.buttonDescription}>
            Execute the chain and send requests to backend
          </div>
          <div className={styles.progressBarOuter}>
            <div
              className={styles.progressBarInner}
              style={{ width: `${Math.min(100, Math.max(0, runProgress))}%` }}
            />
            <span className={styles.progressLabel}>{Math.round(runProgress)}%</span>
          </div>
        </div>
      </div>
      
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Add Nodes:</div>
        <div className={styles.buttonsContainer}>
          <button
            onClick={onAddPromptNode}
            disabled={promptDisabled}
            className={styles.addButton}
            style={getButtonStyle('blue', promptDisabled)}
            onMouseEnter={getHoverStyle('blue', 'darkblue', promptDisabled)}
            onMouseLeave={getLeaveStyle('blue', promptDisabled)}
          >
            Add Prompt Node
          </button>

          <button
            onClick={onAddApiNode}
            disabled={apiDisabled}
            className={styles.addButton}
            style={getButtonStyle('green', apiDisabled)}
            onMouseEnter={getHoverStyle('green', 'darkgreen', apiDisabled)}
            onMouseLeave={getLeaveStyle('green', apiDisabled)}
          >
            Add API Node
          </button>

          <button
            onClick={onAddFileUploadNode}
            disabled={fileUploadDisabled}
            className={styles.addButton}
            style={getButtonStyle('indigo', fileUploadDisabled)}
            onMouseEnter={getHoverStyle('indigo', 'darkviolet', fileUploadDisabled)}
            onMouseLeave={getLeaveStyle('indigo', fileUploadDisabled)}
          >
            Add File Upload Node
          </button>

          <button
            onClick={onAddFileDownloadNode}
            disabled={fileDownloadDisabled}
            className={styles.addButton}
            style={getButtonStyle('darkgreen', fileDownloadDisabled)}
            onMouseEnter={getHoverStyle('darkgreen', 'green', fileDownloadDisabled)}
            onMouseLeave={getLeaveStyle('darkgreen', fileDownloadDisabled)}
          >
            Add File Download Node
          </button>

          <button
            onClick={onAddManualTestNode}
            disabled={manualTestDisabled}
            className={styles.addButton}
            style={getButtonStyle('orange', manualTestDisabled)}
            onMouseEnter={getHoverStyle('orange', 'darkorange', manualTestDisabled)}
            onMouseLeave={getLeaveStyle('orange', manualTestDisabled)}
          >
            Add Manual Test Node
          </button>

          <button
            onClick={onAddAutomatedTestNode}
            disabled={automatedTestDisabled}
            className={styles.addButton}
            style={getButtonStyle('deepskyblue', automatedTestDisabled)}
            onMouseEnter={getHoverStyle('deepskyblue', 'steelblue', automatedTestDisabled)}
            onMouseLeave={getLeaveStyle('deepskyblue', automatedTestDisabled)}
          >
            Add Automated Test Node
          </button>

          <button
            onClick={onAddOptimizationNode}
            disabled={optimizationDisabled}
            className={styles.addButton}
            style={getButtonStyle('green', optimizationDisabled)}
            onMouseEnter={getHoverStyle('green', 'forestgreen', optimizationDisabled)}
            onMouseLeave={getLeaveStyle('green', optimizationDisabled)}
          >
            Add Optimization Node
          </button>

          <button
            onClick={onAddCheckStandardsNode}
            disabled={checkStandardsDisabled}
            className={styles.addButton}
            style={getButtonStyle('purple', checkStandardsDisabled)}
            onMouseEnter={getHoverStyle('purple', 'darkviolet', checkStandardsDisabled)}
            onMouseLeave={getLeaveStyle('purple', checkStandardsDisabled)}
          >
            Add Check Standards Node
          </button>

          {/* Добавьте эту кнопку для узла статистики */}
          <button
            onClick={onAddStatisticsNode}
            disabled={statisticsDisabled}
            className={styles.addButton}
            style={getButtonStyle('#3498db', statisticsDisabled)}
            onMouseEnter={getHoverStyle('#3498db', '#2980b9', statisticsDisabled)}
            onMouseLeave={getLeaveStyle('#3498db', statisticsDisabled)}
            title="Add Statistics Node (Allure reports)"
          >
            <div className={styles.buttonContent}>
              Add Statistics Node
            </div>
          </button>

          <button
            onClick={onAddStartNode}
            disabled={startDisabled}
            className={styles.addButton}
            style={getButtonStyle('forestgreen', startDisabled)}
            onMouseEnter={getHoverStyle('forestgreen', 'darkgreen', startDisabled)}
            onMouseLeave={getLeaveStyle('forestgreen', startDisabled)}
            title={hasStartNode ? "Only one START node allowed per tab" : "Add START node"}
          >
            <div className={styles.buttonContent}>
              Add START Node
              {hasStartNode && (
                <span className={styles.checkmark}>✓</span>
              )}
            </div>
          </button>

          <button
            onClick={onAddEndNode}
            disabled={endDisabled}
            className={styles.addButton}
            style={getButtonStyle('firebrick', endDisabled)}
            onMouseEnter={getHoverStyle('firebrick', 'darkred', endDisabled)}
            onMouseLeave={getLeaveStyle('firebrick', endDisabled)}
            title={hasEndNode ? "Only one END node allowed per tab" : "Add END node"}
          >
            <div className={styles.buttonContent}>
              Add END Node
              {hasEndNode && (
                <span className={styles.checkmark}>✓</span>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Get Flow Path:</div>
        <div className={styles.fullWidthButton}>
          <button
            onClick={onGetPathFromStartToEnd}
            disabled={getPathDisabled}
            className={styles.actionButton}
            style={getButtonStyle('purple', getPathDisabled)}
            onMouseEnter={getHoverStyle('purple', 'darkviolet', getPathDisabled)}
            onMouseLeave={getLeaveStyle('purple', getPathDisabled)}
            title={!hasStartNode || !hasEndNode ? "Need both START and END nodes" : "Get path from START to END"}
          >
            Get Path from START to END
          </button>
          <div className={styles.buttonDescription}>
            {!hasStartNode || !hasEndNode 
              ? "Requires both START and END nodes" 
              : "Finds and displays all nodes in the flow path"}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Copy/Paste:</div>
        <div className={styles.buttonGroup}>
          <button
            onClick={onCopySelectedNodes}
            disabled={copyDisabled}
            className={styles.smallButton}
            style={getButtonStyle('gray', copyDisabled)}
            onMouseEnter={getHoverStyle('gray', 'darkslategray', copyDisabled)}
            onMouseLeave={getLeaveStyle('gray', copyDisabled)}
          >
            Copy
          </button>
          <button
            onClick={onPasteCopiedNodes}
            disabled={pasteDisabled}
            className={styles.smallButton}
            style={getButtonStyle('gray', pasteDisabled)}
            onMouseEnter={getHoverStyle('gray', 'darkslategray', pasteDisabled)}
            onMouseLeave={getLeaveStyle('gray', pasteDisabled)}
          >
            Paste
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Import/Export:</div>
        <div className={styles.buttonGroup}>
          <button
            onClick={onExportState}
            disabled={exportDisabled}
            className={styles.smallButton}
            style={getButtonStyle('limegreen', exportDisabled)}
            onMouseEnter={getHoverStyle('limegreen', 'forestgreen', exportDisabled)}
            onMouseLeave={getLeaveStyle('limegreen', exportDisabled)}
          >
            Export
          </button>
          <button
            onClick={onImportState}
            disabled={importDisabled}
            className={styles.smallButton}
            style={getButtonStyle('lightseagreen', importDisabled)}
            onMouseEnter={getHoverStyle('lightseagreen', 'teal', importDisabled)}
            onMouseLeave={getLeaveStyle('lightseagreen', importDisabled)}
          >
            Import
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Reset:</div>
        <div className={styles.fullWidthButton}>
          <button
            onClick={onResetToInitial}
            disabled={resetDisabled}
            className={styles.resetButton}
            style={getButtonStyle('crimson', resetDisabled)}
            onMouseEnter={getHoverStyle('crimson', 'firebrick', resetDisabled)}
            onMouseLeave={getLeaveStyle('crimson', resetDisabled)}
          >
            Reset Current Tab
          </button>
        </div>
      </div>

      <div className={styles.statsPanel}>
        <div className={styles.statRow}>
          <span>Total Tabs:</span>
          <span className={styles.statValue}></span>
        </div>
        <div className={styles.statRow}>
          <span>Prompt Nodes:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'prompt').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>API Nodes:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'api').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>Manual Tests:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'manualTest').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>Automated Tests:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'automatedTest').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>Optimizations:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'optimization').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>Check Standards:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'checkStandards').length}</span>
        </div>
        {/* Добавьте эту строку для статистики узлов */}
        <div className={styles.statRow}>
          <span>Statistics Nodes:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'statistics').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>File Upload Nodes:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'fileUpload').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>File Download Nodes:</span>
          <span className={styles.statValue}>{nodes.filter(n => n.type === 'fileDownload').length}</span>
        </div>
        <div className={styles.statRow}>
          <span>START Nodes:</span>
          <span className={styles.statValue} style={{ 
            color: hasStartNode ? 'forestgreen' : 'slategray'
          }}>
            {nodes.filter(n => n.type === 'start').length}
            {hasStartNode && ' ✓'}
          </span>
        </div>
        <div className={styles.statRow}>
          <span>END Nodes:</span>
          <span className={styles.statValue} style={{ 
            color: hasEndNode ? 'firebrick' : 'slategray'
          }}>
            {nodes.filter(n => n.type === 'end').length}
            {hasEndNode && ' ✓'}
          </span>
        </div>
        <div className={styles.statRow}>
          <span>Next ID:</span>
          <span className={styles.statValue}>{nodeCounter}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;