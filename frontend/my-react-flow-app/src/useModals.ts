import { useState, useCallback } from 'react';
import { 
  ApiNodeData, 
  ManualTestNodeData, 
  AutomatedTestNodeData,
  OptimizationNodeData,
  CheckStandardsNodeData,
  StatisticsNodeData
} from './types';

// Удаляем export у интерфейса, чтобы избежать конфликта с экспортом из ManualTestModal.tsx
interface ManualTestModalPropsInternal {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialData: ManualTestNodeData;
  onSave: (nodeId: string, data: ManualTestNodeData) => void;
  hasFileUploadConnection?: boolean;
  fileName?: string;
  fileContent?: string;
}

export const useModals = () => {
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    initialPrompt: string;
  }>({
    isOpen: false,
    nodeId: null,
    initialPrompt: '',
  });

  const [apiModal, setApiModal] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    initialUrl: string;
    initialMethod: string;
  }>({
    isOpen: false,
    nodeId: null,
    initialUrl: '',
    initialMethod: 'GET',
  });

  const [manualTestModal, setManualTestModal] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    initialData: ManualTestNodeData;
  }>({
    isOpen: false,
    nodeId: null,
    initialData: {},
  });

  const [automatedTestModal, setAutomatedTestModal] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    initialData: AutomatedTestNodeData;
  }>({
    isOpen: false,
    nodeId: null,
    initialData: {},
  });

  const [optimizationModal, setOptimizationModal] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    initialData: OptimizationNodeData;
  }>({
    isOpen: false,
    nodeId: null,
    initialData: {},
  });

  const [checkStandardsModal, setCheckStandardsModal] = useState<{
    isOpen: boolean;
    nodeId: string | null;
    initialData: CheckStandardsNodeData;
  }>({
    isOpen: false,
    nodeId: null,
    initialData: {},
  });

  const isModalOpen = 
    promptModal.isOpen || 
    apiModal.isOpen || 
    manualTestModal.isOpen || 
    automatedTestModal.isOpen || 
    optimizationModal.isOpen || 
    checkStandardsModal.isOpen;

  const openPromptModal = useCallback((nodeId: string, currentPrompt: string) => {
    setPromptModal({
      isOpen: true,
      nodeId,
      initialPrompt: currentPrompt,
    });
  }, []);

  const openApiModal = useCallback((nodeId: string, currentUrl: string, currentMethod: string) => {
    setApiModal({
      isOpen: true,
      nodeId,
      initialUrl: currentUrl,
      initialMethod: currentMethod,
    });
  }, []);

  const openManualTestModal = useCallback((nodeId: string, currentData: ManualTestNodeData) => {
    setManualTestModal({
      isOpen: true,
      nodeId,
      initialData: currentData,
    });
  }, []);

  const openAutomatedTestModal = useCallback((nodeId: string, currentData: AutomatedTestNodeData) => {
    setAutomatedTestModal({
      isOpen: true,
      nodeId,
      initialData: currentData,
    });
  }, []);

  const openOptimizationModal = useCallback((nodeId: string, currentData: OptimizationNodeData) => {
    setOptimizationModal({
      isOpen: true,
      nodeId,
      initialData: currentData,
    });
  }, []);

  const openCheckStandardsModal = useCallback((nodeId: string, currentData: CheckStandardsNodeData) => {
    setCheckStandardsModal({
      isOpen: true,
      nodeId,
      initialData: currentData,
    });
  }, []);

  const closePromptModal = useCallback(() => {
    setPromptModal({
      isOpen: false,
      nodeId: null,
      initialPrompt: '',
    });
  }, []);

  const closeApiModal = useCallback(() => {
    setApiModal({
      isOpen: false,
      nodeId: null,
      initialUrl: '',
      initialMethod: 'GET',
    });
  }, []);

  const closeManualTestModal = useCallback(() => {
    setManualTestModal({
      isOpen: false,
      nodeId: null,
      initialData: {},
    });
  }, []);

  const closeAutomatedTestModal = useCallback(() => {
    setAutomatedTestModal({
      isOpen: false,
      nodeId: null,
      initialData: {},
    });
  }, []);

  const closeOptimizationModal = useCallback(() => {
    setOptimizationModal({
      isOpen: false,
      nodeId: null,
      initialData: {},
    });
  }, []);

  const closeCheckStandardsModal = useCallback(() => {
    setCheckStandardsModal({
      isOpen: false,
      nodeId: null,
      initialData: {},
    });
  }, []);

  const savePromptData = useCallback((
    nodeId: string, 
    prompt: string, 
    updateNodeData: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    updateNodeData(nodeId, { prompt }, 'prompt');
  }, []);

  const saveApiData = useCallback((
    nodeId: string, 
    url: string, 
    method: string, 
    responseStatus?: number | null, 
    responseData?: any, 
    updateNodeData?: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    const data: ApiNodeData = {
      url,
      method,
      ...(responseStatus !== undefined && responseStatus !== null && { responseStatus }),
      ...(responseData !== undefined && { responseData }),
    };
    updateNodeData?.(nodeId, data, 'api');
  }, []);

  const saveManualTestData = useCallback((
    nodeId: string, 
    data: ManualTestNodeData, 
    updateNodeData?: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    updateNodeData?.(nodeId, data, 'manualTest');
  }, []);

  const saveAutomatedTestData = useCallback((
    nodeId: string, 
    data: AutomatedTestNodeData, 
    updateNodeData?: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    updateNodeData?.(nodeId, data, 'automatedTest');
  }, []);

  const saveOptimizationData = useCallback((
    nodeId: string, 
    data: OptimizationNodeData, 
    updateNodeData?: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    updateNodeData?.(nodeId, data, 'optimization');
  }, []);

  const saveCheckStandardsData = useCallback((
    nodeId: string, 
    data: CheckStandardsNodeData, 
    updateNodeData?: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    updateNodeData?.(nodeId, data, 'checkStandards');
  }, []);

  const saveStatisticsData = useCallback((
    nodeId: string, 
    data: StatisticsNodeData, 
    updateNodeData?: (nodeId: string, data: any, nodeType?: string) => void
  ) => {
    updateNodeData?.(nodeId, data, 'statistics');
  }, []);

  return {
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
    saveCheckStandardsData,
    saveStatisticsData,
  };
};