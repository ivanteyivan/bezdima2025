import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  SelectionMode,
  Controls
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowState } from './useFlowState.ts';
import { useModals } from './useModals.ts';
import {
  PromptModal,
  ApiModal,
  ManualTestModal,
  AutomatedTestModal,
  OptimizationModal,
  CheckStandardsModal,
  StatisticsModal
} from './components/modals';
import {
  PromptNode,
  ApiNode,
  StartNode,
  EndNode,
  ManualTestNodeComponent,
  AutomatedTestNodeComponent,
  OptimizationNodeComponent,
  CheckStandardsNodeComponent,
  FileUploadNodeComponent,
  FileDownloadNodeComponent,
  StatisticsNode
} from './components/nodes';
import { Sidebar } from './components/SidebarComponent'; // Добавлен импорт Sidebar
import { ChatWindow } from './components/ChatWindowComponent/ChatWindow';
import { TabsBar } from './components/TabsBarComponent/TabsBar';
import './global.scss';
import { TestGenerationStatistics } from './types';

const App: React.FC = () => {
  const flowState = useFlowState();
  const modals = useModals();
  
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [useAdkGlobal, setUseAdkGlobal] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('useAdkMode');
      return raw === 'true';
    } catch (e) { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('useAdkMode', useAdkGlobal ? 'true' : 'false'); } catch (e) {}
  }, [useAdkGlobal]);
  
  // Локальное состояние для модального окна статистики
  const [statisticsModalState, setStatisticsModalState] = useState<{
    isOpen: boolean;
    statistics: TestGenerationStatistics | null;
  }>({
    isOpen: false,
    statistics: null,
  });

  const {
    tabs,
    activeTabId,
    nodeCounter,
    copiedNodes,
    activeTab,
    nodes,
    edges,
    hasStartNode,
    hasEndNode,
    isRunning,
    runProgress,
    setTabs,
    setActiveTabId,
    addNewTab,
    deleteTab,
    switchTab,
    addPromptNode,
    addApiNode,
    addManualTestNode,
    addAutomatedTestNode,
    addOptimizationNode,
    addCheckStandardsNode,
    addStatisticsNode,
    addFileUploadNode,
    addFileDownloadNode,
    addStartNode,
    addEndNode,
    runFlow,
    insertGraph,
    updateNodeData,
    deleteSelectedElements,
    copySelectedNodes,
    pasteCopiedNodes,
    exportState,
    importState,
    resetToInitial,
    getPathFromStartToEnd,
    onNodesChange,
    onEdgesChange,
    onConnect,
    generateUniqueTabName,
    resolveNodeCollisions 
  } = flowState;
  
  const {
    promptModal,
    apiModal,
    manualTestModal,
    automatedTestModal,
    optimizationModal,
    checkStandardsModal,
    isModalOpen,
    openPromptModal,
    openApiModal,
    openManualTestModal,
    openAutomatedTestModal,
    openOptimizationModal,
    openCheckStandardsModal,
    closePromptModal,
    closeApiModal,
    closeManualTestModal,
    closeAutomatedTestModal,
    closeOptimizationModal,
    closeCheckStandardsModal,
    savePromptData,
    saveApiData,
    saveManualTestData,
    saveAutomatedTestData,
    saveOptimizationData,
    saveCheckStandardsData
  } = modals;
  
  const selectedNodeCount = nodes.filter(node => node.selected).length;
  const selectedEdgeCount = edges.filter(edge => edge.selected).length;
  
  const getConnectedPromptText = useCallback((apiNodeId: string): string => {
    const edge = edges.find(e => e.target === apiNodeId);
    if (!edge) return '';
    
    const sourceNode = nodes.find(n => n.id === edge.source && n.type === 'prompt');
    if (!sourceNode) return '';
    
    return sourceNode.data?.prompt || '';
  }, [nodes, edges]);

  // Функция для получения информации о подключении к FileUpload для ManualTest узла
  const getFileUploadConnectionInfo = useCallback((nodeId: string | null) => {
    if (!nodeId) {
      return {
        hasFileUploadConnection: false,
        fileName: '',
        fileContent: ''
      };
    }
    
    // Находим все входящие соединения к этому узлу
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(node => node.id === edge.source);
      
      // Проверяем, является ли источник узлом FileUpload
      if (sourceNode?.type === 'fileUpload') {
        return {
          hasFileUploadConnection: true,
          fileName: sourceNode.data?.fileName || '',
          fileContent: sourceNode.data?.fileContent || ''
        };
      }
      
      // Также проверяем непрямые соединения через другие узлы
      if (sourceNode?.type === 'prompt' || sourceNode?.type === 'api') {
        // Проверяем, есть ли у этого источника подключение к FileUpload
        const sourceIncomingEdges = edges.filter(e => e.target === sourceNode.id);
        for (const sourceEdge of sourceIncomingEdges) {
          const fileUploadNode = nodes.find(n => n.id === sourceEdge.source && n.type === 'fileUpload');
          if (fileUploadNode) {
            return {
              hasFileUploadConnection: true,
              fileName: fileUploadNode.data?.fileName || '',
              fileContent: fileUploadNode.data?.fileContent || ''
            };
          }
        }
      }
    }
    
    return {
      hasFileUploadConnection: false,
      fileName: '',
      fileContent: ''
    };
  }, [nodes, edges]);

  // Получаем информацию о подключении для текущего ManualTest модального окна
  const fileUploadConnectionInfo = useMemo(() => {
    return getFileUploadConnectionInfo(manualTestModal.nodeId);
  }, [manualTestModal.nodeId, getFileUploadConnectionInfo]);

  // Получаем информацию о подключении к файлу (или источнику требований) для Optimization модального окна
  const optimizationFileUploadConnectionInfo = useMemo(() => {
    return getFileUploadConnectionInfo(optimizationModal.nodeId);
  }, [optimizationModal.nodeId, getFileUploadConnectionInfo]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow typing and backspace in inputs, textareas and contenteditable elements
      const active = document.activeElement as HTMLElement | null;
      const isEditable = active && (
        active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable
      );
      if (isEditable) return;

      if (isModalOpen || statisticsModalState.isOpen) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElements(isModalOpen);
      }
      
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelectedNodes(isModalOpen);
      }
      
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteCopiedNodes(isModalOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, statisticsModalState.isOpen, deleteSelectedElements, copySelectedNodes, pasteCopiedNodes]);
  
  const handleSwitchTab = useCallback((tabId: string) => {
    switchTab(tabId, isModalOpen);
  }, [isModalOpen, switchTab]);

  const handleDeleteTab = useCallback((tabId: string) => {
    deleteTab(tabId, isModalOpen);
  }, [isModalOpen, deleteTab]);

  const handleAddTab = useCallback(() => {
    addNewTab(isModalOpen);
  }, [isModalOpen, addNewTab]);

  // Добавлено: обработчик для завершения перетаскивания узла
  const handleNodeDragStop = useCallback(() => {
    if (!isModalOpen && !statisticsModalState.isOpen) {
      resolveNodeCollisions();
    }
  }, [isModalOpen, statisticsModalState.isOpen, resolveNodeCollisions]);
  
  // Функция для открытия модального окна статистики
  const openStatisticsModal = useCallback((statistics: TestGenerationStatistics) => {
    console.log('Opening statistics modal with data:', statistics);
    setStatisticsModalState({
      isOpen: true,
      statistics,
    });
  }, []);

  // Функция для закрытия модального окна статистики
  const closeStatisticsModal = useCallback(() => {
    setStatisticsModalState({
      isOpen: false,
      statistics: null,
    });
  }, []);

  // Обработчик для открытия статистики из узла
  const handleOpenStatisticsModal = useCallback((nodeId: string, statistics: TestGenerationStatistics | null) => {
    console.log('Statistics node clicked, nodeId:', nodeId, 'statistics:', statistics);
    if (statistics) {
      openStatisticsModal(statistics);
    } else {
      // Если нет статистики, показываем пустое модальное окно
      openStatisticsModal({
        totalTests: 0,
        byPriority: { high: 0, medium: 0, low: 0 },
        byTag: {},
        byFeature: {},
        bySuite: {},
        testCases: []
      });
    }
  }, [openStatisticsModal]);

  const nodeTypes = {
    prompt: (props: any) => <PromptNode {...props} onOpenPromptModal={openPromptModal} />,
    api: (props: any) => <ApiNode {...props} onOpenApiModal={openApiModal} />,
    start: (props: any) => <StartNode {...props} />,
    end: (props: any) => <EndNode {...props} />,
    fileUpload: (props: any) => (
      <FileUploadNodeComponent
        {...props}
        onUpdateNodeData={(nodeId: string, data: any) => updateNodeData(nodeId, data, 'fileUpload')}
      />
    ),
    fileDownload: (props: any) => (
      <FileDownloadNodeComponent
        {...props}
        onUpdateNodeData={(nodeId: string, data: any) => updateNodeData(nodeId, data, 'fileDownload')}
      />
    ),
    manualTest: (props: any) => <ManualTestNodeComponent {...props} onOpenManualTestModal={openManualTestModal} />,
    automatedTest: (props: any) => <AutomatedTestNodeComponent {...props} onOpenAutomatedTestModal={openAutomatedTestModal} />,
    optimization: (props: any) => <OptimizationNodeComponent {...props} onOpenOptimizationModal={openOptimizationModal} />,
    checkStandards: (props: any) => <CheckStandardsNodeComponent {...props} onOpenCheckStandardsModal={openCheckStandardsModal} />,
    statistics: (props: any) => <StatisticsNode {...props} onOpenStatisticsModal={handleOpenStatisticsModal} />,
  };
  
  return (
    <>
      <div className="app-container">
        <div className="app-content">
          <button
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="sidebar-toggle"
            style={{ left: isSidebarVisible ? '310px' : '10px' }}
            title={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            {isSidebarVisible ? '◀' : '▶'}
          </button>
          
          {isSidebarVisible && (
            <Sidebar
              activeTab={activeTab}
              nodes={nodes}
              edges={edges}
              selectedNodeCount={selectedNodeCount}
              selectedEdgeCount={selectedEdgeCount}
              copiedNodes={copiedNodes}
              hasStartNode={hasStartNode}
              hasEndNode={hasEndNode}
              isModalOpen={isModalOpen || statisticsModalState.isOpen}
              nodeCounter={nodeCounter}
              onAddPromptNode={() => addPromptNode(isModalOpen || statisticsModalState.isOpen)}
              onAddApiNode={() => addApiNode(isModalOpen || statisticsModalState.isOpen)}
              onAddFileUploadNode={() => addFileUploadNode(isModalOpen || statisticsModalState.isOpen)}
              onAddFileDownloadNode={() => addFileDownloadNode(isModalOpen || statisticsModalState.isOpen)}
              onAddStartNode={() => addStartNode(isModalOpen || statisticsModalState.isOpen)}
              onAddEndNode={() => addEndNode(isModalOpen || statisticsModalState.isOpen)}
              onAddManualTestNode={() => addManualTestNode(isModalOpen || statisticsModalState.isOpen)}
              onAddAutomatedTestNode={() => addAutomatedTestNode(isModalOpen || statisticsModalState.isOpen)}
              onAddOptimizationNode={() => addOptimizationNode(isModalOpen || statisticsModalState.isOpen)}
              onAddCheckStandardsNode={() => addCheckStandardsNode(isModalOpen || statisticsModalState.isOpen)}
              onAddStatisticsNode={() => addStatisticsNode(isModalOpen || statisticsModalState.isOpen)}
              onRunFlow={runFlow}
              isRunning={isRunning}
              runProgress={runProgress}
              onGetPathFromStartToEnd={getPathFromStartToEnd}
              onCopySelectedNodes={() => copySelectedNodes(isModalOpen || statisticsModalState.isOpen)}
              onPasteCopiedNodes={() => pasteCopiedNodes(isModalOpen || statisticsModalState.isOpen)}
              onExportState={() => exportState(isModalOpen || statisticsModalState.isOpen)}
              onImportState={() => importState(isModalOpen || statisticsModalState.isOpen, generateUniqueTabName)}
              onResetToInitial={() => resetToInitial(isModalOpen || statisticsModalState.isOpen)}
            />
          )}

          <div className="flow-container">
            <ReactFlow
              nodes={nodes as any[]}
              edges={edges}
              onNodesChange={(changes) => {
                if (!isModalOpen && !statisticsModalState.isOpen) onNodesChange(changes);
              }}
              onEdgesChange={(changes) => {
                if (!isModalOpen && !statisticsModalState.isOpen) onEdgesChange(changes);
              }}
              onConnect={(connection) => {
                if (!isModalOpen && !statisticsModalState.isOpen) onConnect(connection);
              }}
              onNodeDragStop={handleNodeDragStop} 
              nodeTypes={nodeTypes}
              selectionKeyCode={null}
              multiSelectionKeyCode={null}
              panOnDrag={[1, 2]}
              selectionOnDrag={true}
              panOnScroll={true}
              zoomOnScroll={true}
              zoomOnDoubleClick={false}
              selectionMode={SelectionMode.Full}
              fitView
              proOptions={{ hideAttribution: true }}
              className="react-flow-wrapper"
              minZoom={0.1}
              maxZoom={4}
            >
              <Controls 
                className="react-flow-controls"
              />
            </ReactFlow>
          </div>
        </div>

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="chat-toggle-button"
        >
          {isChatOpen ? '×' : 'AI'}
        </button>
        <label style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={useAdkGlobal} onChange={(e) => setUseAdkGlobal(e.target.checked)} />
          <span style={{ fontSize: 12 }}>ADK</span>
        </label>

        <TabsBar
          tabs={tabs}
          activeTabId={activeTabId}
          isModalOpen={isModalOpen || statisticsModalState.isOpen}
          onSwitchTab={handleSwitchTab}
          onDeleteTab={handleDeleteTab}
          onAddTab={handleAddTab}
        />

        <PromptModal
          isOpen={promptModal.isOpen}
          onClose={closePromptModal}
          nodeId={promptModal.nodeId}
          initialPrompt={promptModal.initialPrompt}
          onSave={(nodeId, prompt) => savePromptData(nodeId, prompt, updateNodeData)}
        />
        
        <ApiModal
          isOpen={apiModal.isOpen}
          onClose={closeApiModal}
          nodeId={apiModal.nodeId}
          initialUrl={apiModal.initialUrl}
          initialMethod={apiModal.initialMethod}
          onSave={(nodeId, url, method, responseStatus, responseData) => saveApiData(nodeId, url, method, responseStatus, responseData, updateNodeData)}
          connectedPromptText={apiModal.nodeId ? getConnectedPromptText(apiModal.nodeId) : ''}
        />

        <ManualTestModal
          isOpen={manualTestModal.isOpen}
          onClose={closeManualTestModal}
          nodeId={manualTestModal.nodeId}
          initialData={manualTestModal.initialData}
          onSave={(nodeId, data) => saveManualTestData(nodeId, data, updateNodeData)}
          hasFileUploadConnection={fileUploadConnectionInfo.hasFileUploadConnection}
          fileName={fileUploadConnectionInfo.fileName}
          fileContent={fileUploadConnectionInfo.fileContent}
        />

        <AutomatedTestModal
          isOpen={automatedTestModal.isOpen}
          onClose={closeAutomatedTestModal}
          nodeId={automatedTestModal.nodeId}
          initialData={automatedTestModal.initialData}
          onSave={(nodeId, data) => saveAutomatedTestData(nodeId, data, updateNodeData)}
        />

        <OptimizationModal
          isOpen={optimizationModal.isOpen}
          onClose={closeOptimizationModal}
          nodeId={optimizationModal.nodeId}
          initialData={optimizationModal.initialData}
          onSave={(nodeId, data) => saveOptimizationData(nodeId, data, updateNodeData)}
          hasFileUploadConnection={optimizationFileUploadConnectionInfo.hasFileUploadConnection}
          fileName={optimizationFileUploadConnectionInfo.fileName}
          fileContent={optimizationFileUploadConnectionInfo.fileContent}
        />

        <CheckStandardsModal
          isOpen={checkStandardsModal.isOpen}
          onClose={closeCheckStandardsModal}
          nodeId={checkStandardsModal.nodeId}
          initialData={checkStandardsModal.initialData}
          onSave={(nodeId, data) => saveCheckStandardsData(nodeId, data, updateNodeData)}
        />

        {/* Модальное окно статистики */}
        <StatisticsModal
          isOpen={statisticsModalState.isOpen}
          onClose={closeStatisticsModal}
          statistics={statisticsModalState.statistics}
        />
        
        <ChatWindow
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onInsertGraph={insertGraph}
          useAdk={useAdkGlobal}
        />
      </div>
    </>
  );
};

export default App;