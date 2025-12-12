import { useState, useCallback, useEffect } from 'react';
import { 
  NodeChange, 
  EdgeChange, 
  Connection, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge 
} from '@xyflow/react';
import { CustomNode, CustomEdge, Tab, TestGenerationStatistics, StatisticsUtils } from './types';
import { 
  generateManualTest,
  generateUiTests,
  generateApiTests,
  optimizeTests,
  checkStandards,
  generateTestCaseFromOpenapi
} from './api';
import { resolveCollisions } from './utils/resolveCollisions'; 

const LOCAL_STORAGE_KEY = 'flow_state';

const loadStateFromLocalStorage = () => {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    return null;
  }
};

const saveStateToLocalStorage = (state: any) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (error) { }
};

import { showToast } from './utils/toast';

export const useFlowState = () => {
  const savedState = loadStateFromLocalStorage();
  
  const [tabs, setTabs] = useState<Tab[]>(() => {
    if (savedState && savedState.tabs) {
      return savedState.tabs;
    }
    return [
      { 
        id: 'tab1', 
        label: 'Tab 1', 
        nodes: [], 
        edges: [] 
      }
    ];
  });
  
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (savedState && savedState.activeTabId) {
      return savedState.activeTabId;
    }
    return 'tab1';
  });
  
  const [nodeCounter, setNodeCounter] = useState<number>(() => {
    if (savedState && savedState.nodeCounter) {
      return savedState.nodeCounter;
    }
    return 1;
  });
  
  const [copiedNodes, setCopiedNodes] = useState<CustomNode[]>(() => {
    if (savedState && savedState.copiedNodes) {
      return savedState.copiedNodes;
    }
    return [];
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runProgress, setRunProgress] = useState<number>(0);
  
  // Состояние для модального окна статистики
  const [statisticsModalState, setStatisticsModalState] = useState<{
    isOpen: boolean;
    statistics: TestGenerationStatistics | null;
  }>({
    isOpen: false,
    statistics: null,
  });

  useEffect(() => {
    const stateToSave = {
      tabs,
      activeTabId,
      nodeCounter,
      copiedNodes,
      savedAt: new Date().toISOString()
    };
    saveStateToLocalStorage(stateToSave);
  }, [tabs, activeTabId, nodeCounter, copiedNodes]);

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const nodes = activeTab.nodes;
  const edges = activeTab.edges;

  const hasStartNode = nodes.some(node => node.type === 'start');
  const hasEndNode = nodes.some(node => node.type === 'end');

  const generateUniqueTabName = useCallback((baseName: string = 'Tab'): string => {
    let tabNumber = 1;
    let newName = `${baseName} ${tabNumber}`;
    
    while (tabs.some(tab => tab.label === newName)) {
      tabNumber++;
      newName = `${baseName} ${tabNumber}`;
    }
    
    return newName;
  }, [tabs]);

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

  const addNewTab = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    if (tabs.length >= 10) {
      alert('Maximum number of tabs: 10');
      return;
    }
    
    const newLabel = generateUniqueTabName('Tab');
    const newTabId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newTabId,
      label: newLabel,
      nodes: [],
      edges: []
    };
    
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTabId);
  }, [tabs.length, generateUniqueTabName]);

  const deleteTab = useCallback((tabId: string, isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    if (tabs.length <= 1) {
      alert('Cannot delete the last tab');
      return;
    }
    
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      const deletedIndex = tabs.findIndex(tab => tab.id === tabId);
      
      let newActiveTabId;
      if (deletedIndex === tabs.length - 1) {
        newActiveTabId = tabs[deletedIndex - 1].id;
      } else {
        newActiveTabId = tabs[deletedIndex + 1].id;
      }
      
      setActiveTabId(newActiveTabId);
    }
  }, [tabs, activeTabId]);

  const switchTab = useCallback((tabId: string, isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    setActiveTabId(tabId);
  }, []);

  const addPromptNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `prompt-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'prompt',
      position: { 
        x: Math.random() * 400,
        y: Math.random() * 400
      },
      data: { 
        prompt: `Enter your prompt here...`,
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addApiNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `api-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'api',
      position: { 
        x: Math.random() * 400 + 200,
        y: Math.random() * 400
      },
      data: { 
        label: `API Node ${nodeCounter}`,
        createdAt: new Date().toISOString(),
        method: 'GET'
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addManualTestNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `manualTest-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'manualTest',
      position: { 
        x: Math.random() * 400,
        y: Math.random() * 400
      },
      data: { 
        requirements: '',
        feature: '',
        story: '',
        owner: 'QA Team',
        test_type: 'manual',
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addAutomatedTestNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `automatedTest-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'automatedTest',
      position: { 
        x: Math.random() * 400,
        y: Math.random() * 400
      },
      data: { 
        framework: 'selenium',
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addOptimizationNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `optimization-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'optimization',
      position: { 
        x: Math.random() * 400,
        y: Math.random() * 400
      },
      data: { 
        test_cases: [],
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addCheckStandardsNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `checkStandards-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'checkStandards',
      position: { 
        x: Math.random() * 400,
        y: Math.random() * 400
      },
      data: { 
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addStatisticsNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const newNodeId = `statistics-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'statistics',
      position: { 
        x: Math.random() * 400 + 300,
        y: Math.random() * 400
      },
      data: { 
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addFileUploadNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;

    const newNodeId = `fileUpload-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'fileUpload',
      position: { 
        x: Math.random() * 400 + 150,
        y: Math.random() * 400 + 50
      },
      data: { 
        fileName: '',
        fileContent: '',
        uploadedAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addFileDownloadNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;

    const newNodeId = `fileDownload-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'fileDownload',
      position: { 
        x: Math.random() * 400 + 250,
        y: Math.random() * 400 + 100
      },
      data: { 
        generatedAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter]);

  const addStartNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    if (hasStartNode) {
      alert('Only one START node is allowed per tab!');
      return;
    }
    
    const newNodeId = `start-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'start',
      position: { 
        x: 50,
        y: 200
      },
      data: { 
        label: 'Start',
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter, hasStartNode]);

  const insertGraph = useCallback((graph: { nodes?: any[]; edges?: any[] }) => {
    if (!graph || !graph.nodes || graph.nodes.length === 0) return;
    // We'll allocate new node ids based on current nodeCounter
    setNodeCounter(prevNodeCounter => {
      const startCounter = prevNodeCounter;
      setTabs(prevTabs => prevTabs.map(tab => {
        if (tab.id !== activeTabId) return tab;
        const idMap = new Map<string, string>();
        let localIndex = 0;
        const newNodes = (graph.nodes || []).map(n => {
          const newId = `adk-${n.id}-${startCounter + localIndex}`;
          localIndex++;
          idMap.set(n.id, newId);
          // map incoming types (accept phrases and Russian words) to internal types
          const mapIncomingType = (raw: any) => {
            const s = (raw || '').toString().toLowerCase();
            if (s.includes('start')) return 'start';
            if (s.includes('end')) return 'end';
            if (s.includes('file') && s.includes('upload')) return 'fileUpload';
            if (s.includes('загруз')) return 'fileUpload';
            if (s.includes('file') && s.includes('download')) return 'fileDownload';
            if (s.includes('скач')) return 'fileDownload';
            if (s.includes('stat') || s.includes('стат')) return 'statistics';
            if (s.includes('manual') || s.includes('ручн')) return 'manualTest';
            if (s.includes('automated') || s.includes('автомат')) return 'automatedTest';
            if (s.includes('check') || s.includes('провер')) return 'checkStandards';
            if (s.includes('opt') || s.includes('оптимиз')) return 'optimization';
            if (s.includes('prompt') || s.includes('промп')) return 'prompt';
            if (s.includes('api') || s.includes('endpoint') || s.includes('запрос')) return 'api';
            return 'api';
          };
          const type = mapIncomingType(n.type || n['component'] || n['label'] || '');
          const pos = n.position || { x: (Math.random() * 400), y: (Math.random() * 200) };
          return {
            id: newId,
            type,
            position: {
              x: (pos.x || 0) + 20,
              y: (pos.y || 0) + 20
            },
            data: {
              ...n.data,
              createdAt: new Date().toISOString(),
              originalAdkId: n.id
            }
          } as any;
        });
        // Filter out start/end node duplicates and enforce single incoming edge per target
        const existingIncoming: Record<string, number> = {};
        tab.edges.forEach(edge => {
          existingIncoming[edge.target] = (existingIncoming[edge.target] || 0) + 1;
        });

        const allowedNodes: any[] = [];
        const skippedNodes: string[] = [];
        let skippedEdgesCount = 0;

        // Handle start/end uniqueness
        for (const node of newNodes) {
          if (node.type === 'start' && tab.nodes.some(n => n.type === 'start')) {
            skippedNodes.push(node.type);
            continue;
          }
          if (node.type === 'end' && tab.nodes.some(n => n.type === 'end')) {
            skippedNodes.push(node.type);
            continue;
          }
          allowedNodes.push(node);
        }

        // Build edges while enforcing only one incoming per target
        const newEdges: any[] = [];
        (graph.edges || []).forEach((e, idx) => {
          const source = idMap.get(e.source) || e.source;
          const target = idMap.get(e.target) || e.target;
          // If the target was one of the skipped nodes, skip this edge
          const targetNodeWasAdded = allowedNodes.some(n => n.id === target);
          if (!targetNodeWasAdded && idMap.has(e.target)) {
            // target was in graph but was skipped (start/end etc.) => skip edge
            skippedEdgesCount++;
            return;
          }

          // enforce single incoming
          const currentIncoming = existingIncoming[target] || 0;
          if (currentIncoming >= 1) {
            skippedEdgesCount++;
            return;
          }

          newEdges.push({
            id: `adk-edge-${Date.now()}-${idx}`,
            source,
            target,
            data: e.data || {}
          });
          existingIncoming[target] = currentIncoming + 1;
        });

        if (skippedNodes.length > 0) {
          showToast(`Skipped creating nodes: ${skippedNodes.join(', ')} (start/end uniqueness)`, 'warning');
        }
        if (skippedEdgesCount > 0) {
          showToast(`Skipped ${skippedEdgesCount} edge(s) to avoid multiple incoming edges`, 'warning');
        }

        return {
          ...tab,
          nodes: [...tab.nodes, ...allowedNodes],
          edges: [...tab.edges, ...newEdges]
        };
      }));
      return startCounter + (graph.nodes || []).length;
    });
  }, [activeTabId, setTabs]);

  const addEndNode = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    if (hasEndNode) {
      alert('Only one END node is allowed per tab!');
      return;
    }
    
    const newNodeId = `end-${nodeCounter}`;
    const newNode: CustomNode = {
      id: newNodeId,
      type: 'end',
      position: { 
        x: 800,
        y: 200
      },
      data: { 
        label: 'End',
        createdAt: new Date().toISOString()
      }
    };

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, newNode]
          };
        }
        return tab;
      })
    );
    setNodeCounter((prevCounter) => prevCounter + 1);
  }, [activeTabId, nodeCounter, hasEndNode]);

  const updateNodeData = useCallback((nodeId: string, data: any, nodeType?: string) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: tab.nodes.map(node => {
              if (node.id === nodeId) {
                if (nodeType && node.type !== nodeType) {
                  return node;
                }
                return {
                  ...node,
                  data: {
                    ...node.data,
                    ...data
                  }
                };
              }
              return node;
            })
          };
        }
        return tab;
      })
    );
  }, [activeTabId]);

  const deleteSelectedElements = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          const selectedNodeIds = new Set(
            tab.nodes.filter(node => node.selected).map(node => node.id)
          );
          
          const newNodes = tab.nodes.filter(node => !node.selected);
          const newEdges = tab.edges.filter(edge => 
            !edge.selected &&
            !selectedNodeIds.has(edge.source) && 
            !selectedNodeIds.has(edge.target)
          );
          
          return { ...tab, nodes: newNodes, edges: newEdges };
        }
        return tab;
      })
    );
  }, [activeTabId]);

  const copySelectedNodes = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const selectedNodes = activeTab.nodes.filter(node => 
      node.selected && (node.type === 'prompt' || node.type === 'api' || 
                       node.type === 'manualTest' || node.type === 'automatedTest' ||
                       node.type === 'optimization' || node.type === 'checkStandards' ||
                       node.type === 'fileUpload' || node.type === 'fileDownload' ||
                       node.type === 'statistics')
    );
    
    if (selectedNodes.length === 0) {
      const hasSelectedStartEnd = activeTab.nodes.some(node => 
        node.selected && (node.type === 'start' || node.type === 'end')
      );
      if (hasSelectedStartEnd) {
        alert('START and END nodes cannot be copied. Select only content nodes to copy.');
      } else {
        alert('No valid nodes selected for copying. Select content nodes (Prompt, API, Test, etc.).');
      }
      return;
    }
    
    const nodesCopy = JSON.parse(JSON.stringify(selectedNodes));
    setCopiedNodes(nodesCopy);
    
    const clipboardData = {
      type: 'react-flow-nodes',
      nodes: nodesCopy,
      copiedAt: new Date().toISOString()
    };
    
    navigator.clipboard.writeText(JSON.stringify(clipboardData))
      .catch(() => {
        // Игнорируем ошибки буфера обмена
      });
  }, [activeTab]);

  const pasteCopiedNodes = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    if (copiedNodes.length === 0) return;
    
    const newNodes: CustomNode[] = [];
    let currentCounter = nodeCounter;
    
    copiedNodes.forEach(node => {
      const newNodeId = `node-${currentCounter}`;
      const newNode: CustomNode = {
        ...JSON.parse(JSON.stringify(node)),
        id: newNodeId,
        position: {
          x: node.position.x + 20,
          y: node.position.y + 20
        },
        selected: false,
        data: {
          ...node.data,
          createdAt: node.data.createdAt || new Date().toISOString()
        }
      };
      
      newNodes.push(newNode);
      currentCounter++;
    });
    
    setNodeCounter(currentCounter);
    
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: [...tab.nodes, ...newNodes]
          };
        }
        return tab;
      })
    );
  }, [copiedNodes, activeTabId, nodeCounter]);

  const exportState = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    const state = {
      tabs,
      activeTabId,
      nodeCounter,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      nodesDataInfo: {
        totalNodes: tabs.reduce((sum, tab) => sum + tab.nodes.length, 0),
        nodeTypes: tabs.reduce((acc, tab) => {
          tab.nodes.forEach(node => {
            const type = node.type || 'default';
            acc[type] = (acc[type] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
      }
    };
    
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-flow-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [tabs, activeTabId, nodeCounter]);

  const importState = useCallback((isModalOpen: boolean, generateUniqueTabNameFn: (baseName?: string) => string) => {
    if (isModalOpen) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedState = JSON.parse(event.target?.result as string);
          
          if (!importedState.tabs || !Array.isArray(importedState.tabs)) {
            throw new Error('Invalid state format: tabs missing or not an array');
          }
          
          const tabNames = new Set<string>();
          const duplicateNames: string[] = [];
          
          importedState.tabs.forEach((tab: any) => {
            if (tabNames.has(tab.label)) {
              duplicateNames.push(tab.label);
            }
            tabNames.add(tab.label);
          });
          
          if (duplicateNames.length > 0) {
            const renamedTabs = importedState.tabs.map((tab: any, index: number) => {
              if (duplicateNames.includes(tab.label)) {
                const uniqueName = generateUniqueTabNameFn(tab.label.split(' ')[0] || 'Tab');
                return { ...tab, label: uniqueName };
              }
              return tab;
            });
            
            setTabs(renamedTabs);
          } else {
            setTabs(importedState.tabs);
          }
          
          setActiveTabId(importedState.activeTabId || importedState.tabs[0]?.id || 'tab1');
          setNodeCounter(importedState.nodeCounter || 1);
          
        } catch (error) {
          alert('Import error: invalid file format');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  }, [generateUniqueTabName]);

  const resetToInitial = useCallback((isModalOpen: boolean) => {
    if (isModalOpen) return;
    
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return { 
            ...tab, 
            nodes: [],
            edges: []
          };
        }
        return tab;
      })
    );
    setNodeCounter(1);
  }, [activeTabId]);

  const getPathFromStartToEnd = useCallback(() => {
    const startNode = nodes.find(node => node.type === 'start');
    const endNode = nodes.find(node => node.type === 'end');
    
    if (!startNode) {
      alert('START node not found!');
      return;
    }
    
    if (!endNode) {
      alert('END node not found!');
      return;
    }

    const outgoingMap = new Map<string, string[]>();
    const incomingMap = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!outgoingMap.has(edge.source)) outgoingMap.set(edge.source, []);
      if (!incomingMap.has(edge.target)) incomingMap.set(edge.target, []);
      outgoingMap.get(edge.source)!.push(edge.target);
      incomingMap.get(edge.target)!.push(edge.source);
    });

    const reachableFromStart = new Set<string>();
    const queueFromStart: string[] = [startNode.id];
    while (queueFromStart.length) {
      const current = queueFromStart.shift() as string;
      if (reachableFromStart.has(current)) continue;
      reachableFromStart.add(current);
      (outgoingMap.get(current) || []).forEach(next => queueFromStart.push(next));
    }

    const reachableToEnd = new Set<string>();
    const queueToEnd: string[] = [endNode.id];
    while (queueToEnd.length) {
      const current = queueToEnd.shift() as string;
      if (reachableToEnd.has(current)) continue;
      reachableToEnd.add(current);
      (incomingMap.get(current) || []).forEach(prev => queueToEnd.push(prev));
    }

    const relevantNodeIds = new Set(
      nodes
        .map(node => node.id)
        .filter(id => reachableFromStart.has(id) && reachableToEnd.has(id))
    );

    if (!relevantNodeIds.size || !relevantNodeIds.has(endNode.id)) {
      alert('No valid path from START to END was found.');
      return;
    }

    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    relevantNodeIds.forEach(id => {
      adjacency.set(id, []);
      inDegree.set(id, 0);
    });

    edges.forEach(edge => {
      if (!relevantNodeIds.has(edge.source) || !relevantNodeIds.has(edge.target)) return;
      adjacency.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    const steps: string[][] = [];
    let currentLayer: string[] = Array.from(relevantNodeIds).filter(id => (inDegree.get(id) || 0) === 0);
    const processed = new Set<string>();

    while (currentLayer.length) {
      steps.push(currentLayer);
      const nextLayer: string[] = [];

      currentLayer.forEach(nodeId => {
        processed.add(nodeId);
        (adjacency.get(nodeId) || []).forEach(targetId => {
          const updatedDegree = (inDegree.get(targetId) || 0) - 1;
          inDegree.set(targetId, updatedDegree);
          if (updatedDegree === 0) {
            nextLayer.push(targetId);
          }
        });
      });

      currentLayer = nextLayer;
    }

    if (processed.size !== relevantNodeIds.size || !processed.has(endNode.id)) {
      alert('Graph has cycles or disconnected nodes between START and END. Please fix the flow.');
      return;
    }

    const nodeById = new Map(nodes.map(node => [node.id, node]));
    const actionSteps = steps.map(layer => layer
      .map(id => nodeById.get(id))
      .filter(Boolean) as CustomNode[]
    );

    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: tab.nodes.map(node => ({
              ...node,
              selected: relevantNodeIds.has(node.id)
            }))
          };
        }
        return tab;
      })
    );

    let summaryText = 'Sequential actions from START to END.\n';
    summaryText += 'Next step starts only after all incoming actions are completed.\n\n';

    actionSteps.forEach((layer, index) => {
      summaryText += `Step ${index + 1}:\n`;
      layer.forEach(node => {
        summaryText += `  - ${node.type?.toUpperCase()}: ${node.id}\n`;
      });
      summaryText += '\n';
    });

    summaryText += `Total steps: ${actionSteps.length}\n`;
    summaryText += `Nodes involved: ${relevantNodeIds.size}\n`;

    const alertText = summaryText.length > 2000 
      ? summaryText.substring(0, 2000) + '...\n\n(truncated, see console for full details)' 
      : summaryText;

    alert(alertText);

    return { steps: actionSteps, nodeOrder: steps };
  }, [nodes, edges, activeTabId]);

  const runFlow = useCallback(async () => {
    setIsRunning(true);
    setRunProgress(0);
    try {
      const nodeById = new Map(nodes.map(n => [n.id, n]));
      const outgoing = new Map<string, string[]>();
      const incoming = new Map<string, string[]>();
      edges.forEach(e => {
        if (!outgoing.has(e.source)) outgoing.set(e.source, []);
        outgoing.get(e.source)!.push(e.target);
        if (!incoming.has(e.target)) incoming.set(e.target, []);
        incoming.get(e.target)!.push(e.source);
      });

      const inDegree = new Map<string, number>();
      nodes.forEach(n => inDegree.set(n.id, incoming.get(n.id)?.length || 0));
      let layer = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
      const processed = new Set<string>();
      const totalNodes = nodes.length || 1;
      const results = new Map<string, any>();

      const getInboundPayloads = (nodeId: string) => {
        const srcs = incoming.get(nodeId) || [];
        // Берём первый входящий, остальные игнорируем (кроме END, но ему вход не нужен для вычислений)
        const first = srcs[0];
        return first ? [results.get(first)] : [];
      };

      while (layer.length) {
        const next: string[] = [];
        for (const nodeId of layer) {
          processed.add(nodeId);
          const node = nodeById.get(nodeId);
          if (!node) continue;

          let result: any = null;
          const inbound = getInboundPayloads(nodeId);

          const missing: string[] = [];

          if (node.type === 'fileUpload') {
            result = {
              fileName: node.data?.fileName,
              fileContent: node.data?.fileContent
            };
          } else if (node.type === 'prompt') {
            result = node.data?.prompt;
          } else if (node.type === 'manualTest') {
            const mode = node.data?.mode || 'text';
            const hasFile = !!inbound[0]?.fileContent;
            const specContent = hasFile ? inbound[0]?.fileContent : undefined;
            const url = !hasFile ? (node.data?.openapi_url || node.data?.specUrl) : '';
            const format = node.data?.openapi_format || node.data?.format || 'auto';

            if (!node.data?.story) missing.push('story');
            if (!node.data?.feature) missing.push('feature');
            if (!node.data?.owner) missing.push('owner');
            if (!node.data?.test_type) missing.push('test_type');

            if (hasFile) {
              // Файл имеет приоритет: используем spec_content
              const payload: any = { format };
              payload.spec_content = specContent;
              const res = await generateTestCaseFromOpenapi(payload);
              result = res?.code || res;
              updateNodeData(
                nodeId,
                {
                  requirements: specContent || '',
                  requirements_text: '',
                  mode: 'openapi',
                  fromFile: true,
                  openapi_url: '',
                  openapi_format: format,
                  preview: (specContent || '').slice(0, 40),
                  linkedFileName: inbound[0]?.fileName
                },
                'manualTest'
              );
            } else if (mode === 'text') {
              const reqText = node.data?.requirements_text || node.data?.requirements;
              if (!reqText) missing.push('requirements_text');
              if (missing.length) throw new Error(`Запуск остановлен: заполните поля — ${missing.join(', ')}`);
              const res = await generateManualTest({
                requirements: reqText,
                feature: node.data?.feature,
                story: node.data?.story,
                owner: node.data?.owner,
                test_type: node.data?.test_type
              });
              result = res?.code || res;
              updateNodeData(nodeId, { requirements: reqText, mode, fromFile: false }, 'manualTest');
            } else {
              if (hasFile && url) {
                throw new Error('Нельзя указывать URL, когда подключён файл спецификации');
              }
              if (!hasFile && !url) {
                throw new Error('Нужно подключить файл или указать URL для OpenAPI');
              }
              const payload: any = { format };
              if (specContent) {
                payload.spec_content = specContent;
              } else if (url) {
                payload.url = url;
              }
              try {
                const res = await generateTestCaseFromOpenapi(payload);
                result = res?.code || res;
                updateNodeData(
                  nodeId,
                  {
                    requirements: specContent || '',
                    requirements_text: node.data?.requirements_text,
                    mode,
                    fromFile: hasFile,
                    openapi_url: hasFile ? '' : url,
                    openapi_format: format,
                    preview: (specContent || url || '').slice(0, 40)
                  },
                  'manualTest'
                );
              } catch (err: any) {
                throw new Error(`Ошибка генерации по OpenAPI: ${err?.message || err}`);
              }
            }
          } else if (node.type === 'automatedTest') {
            const inboundCode = inbound[0]?.code || inbound[0];
            const inboundFileContent = inbound[0]?.fileContent;
            const openapiSpec = node.data?.openapi_spec || inboundFileContent;
            const testCases = node.data?.test_cases || inboundCode || '';

            // Validation: we need at least one source to generate tests
            if (!testCases && !openapiSpec) {
              throw new Error('Автоматизированный узел: укажите test_cases, подключите спецификацию OpenAPI или введите исходящие тест-кейсы.');
            }

            if (openapiSpec) {
              try {
                const res = await generateApiTests({
                  openapi_spec: openapiSpec,
                  test_cases: node.data?.test_cases,
                  base_url: node.data?.base_url
                });
                result = res?.code || res;
                // Persist generated code/preview to node
                updateNodeData?.(nodeId, {
                  generated_code: result,
                  preview: (result || '').slice(0, 500),
                  generatedAt: new Date().toISOString(),
                  openapi_spec: openapiSpec,
                  fromFile: !!inboundFileContent,
                  linkedFileName: inbound[0]?.fileName || node.data?.linkedFileName || undefined
                }, 'automatedTest');
              } catch (err: any) {
                throw new Error(`Ошибка генерации API тестов: ${err?.message || err}`);
              }
            } else {
              try {
                const res = await generateUiTests({
                  test_cases: testCases || '',
                  requirements: node.data?.requirements,
                  framework: node.data?.framework
                });
                result = res?.code || res;
                updateNodeData?.(nodeId, {
                  generated_code: result,
                  preview: (result || '').slice(0, 500),
                  generatedAt: new Date().toISOString()
                }, 'automatedTest');
              } catch (err: any) {
                throw new Error(`Ошибка генерации UI тестов: ${err?.message || err}`);
              }
            }
          } else if (node.type === 'api') {
            const specContent = inbound[0]?.fileContent || node.data?.spec_content;
            if (specContent) {
              result = await generateApiTests({
                openapi_spec: specContent,
                test_cases: node.data?.test_cases,
                base_url: node.data?.url
              });
            }
          } else if (node.type === 'optimization') {
            const tests = inbound.map(v => v?.code || v).filter(Boolean);
            result = await optimizeTests({
              test_cases: tests.length ? tests : node.data?.test_cases || [],
              requirements: node.data?.requirements || '',
              defect_history: node.data?.defect_history || ''
            });
            // Persist raw optimization result into the optimization node
            try {
              updateNodeData?.(nodeId, {
                raw_result: result,
                preview: typeof result === 'string' ? (result.substring(0, 200) + (result.length > 200 ? '...' : '')) : (JSON.stringify(result).substring(0, 200) + '...'),
                lastRunAt: new Date().toISOString()
              }, 'optimization');
            } catch (e) {
              // non-fatal
            }
          } else if (node.type === 'checkStandards') {
            const tc = inbound[0]?.code || inbound[0];
            result = await checkStandards({
              test_case: tc || node.data?.test_case,
              test_cases: node.data?.test_cases
            });
          } else if (node.type === 'statistics') {
            // Получаем данные из предыдущего узла (может быть код тестов или результат оптимизации)
            const inboundData = inbound[0]?.code || inbound[0] || '';
            let generationStats: TestGenerationStatistics | null = null;

            if (typeof inboundData === 'object' && inboundData !== null) {
              // Попытка нормализовать ответ оптимизации в структуру TestGenerationStatistics
              const total = inboundData.coverage?.total_tests || (Array.isArray(inboundData.test_cases) ? inboundData.test_cases.length : 0);
              const priorityImprovements: string[] = inboundData.improvements?.priority_improvements || [];
              const testCases = priorityImprovements.map((s: string, idx: number) => ({
                name: s,
                priority: 'medium',
                tags: [],
                feature: '',
                suite: 'api',
                hasLink: false,
                jiraId: undefined
              }));

              generationStats = {
                totalTests: total || 0,
                byPriority: { high: 0, medium: 0, low: 0 },
                byTag: {},
                byFeature: {},
                bySuite: {},
                testCases
              };
            } else if (typeof inboundData === 'string' && inboundData.trim()) {
              // Генерируем статистику из кода тестов
              generationStats = StatisticsUtils.generateTestGenerationStats(inboundData);
              if (!generationStats) {
                generationStats = {
                  totalTests: 0,
                  byPriority: { high: 0, medium: 0, low: 0 },
                  byTag: {},
                  byFeature: {},
                  bySuite: {},
                  testCases: []
                };
              }
            } else {
              // Если данных нет, создаем пустую статистику
              generationStats = {
                totalTests: 0,
                byPriority: { high: 0, medium: 0, low: 0 },
                byTag: {},
                byFeature: {},
                bySuite: {},
                testCases: []
              };
            }

            result = generationStats;
            updateNodeData(nodeId, {
              generationStatistics: generationStats,
              rawData: typeof inboundData === 'string' ? (inboundData.substring(0, 500) + (inboundData.length > 500 ? '...' : '')) : JSON.stringify(inboundData || {}).substring(0, 500),
              generatedAt: new Date().toISOString(),
              preview: generationStats.totalTests > 0 ? `${generationStats.totalTests} tests, ${generationStats.byPriority.high} critical` : 'No data'
            }, 'statistics');
          } else if (node.type === 'fileDownload') {
            const payload = inbound[0]?.code || inbound[0];
            // Ensure payload is string (serialize objects returned from optimizers)
            result = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
          } else if (node.type === 'start' || node.type === 'end') {
            result = null;
          }

          results.set(nodeId, result);
          setRunProgress(Math.round((processed.size / totalNodes) * 100));
          
          // Обновление данных узла fileDownload
          if (node.type === 'fileDownload') {
            setTabs(prev => prev.map(tab => {
              if (tab.id !== activeTabId) return tab;
              return {
                ...tab,
                nodes: tab.nodes.map(n => n.id === nodeId ? ({
                  ...n,
                  data: {
                    ...n.data,
                    payload: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                    generatedAt: new Date().toISOString()
                  }
                }) : n)
              };
            }));
          }

          (outgoing.get(nodeId) || []).forEach(t => {
            const deg = (inDegree.get(t) || 0) - 1;
            inDegree.set(t, deg);
            if (deg === 0) next.push(t);
          });
        }
        layer = next;
      }

      setRunProgress(100);
      showToast('Запуск завершён. Результаты в связанных узлах.', 'info');
    } catch (e) {
      showToast('Ошибка выполнения: ' + (e as any)?.message, 'error');
    } finally {
      setIsRunning(false);
    }
  }, [nodes, edges, activeTabId, setTabs, updateNodeData]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            nodes: applyNodeChanges(changes, tab.nodes as any[]) as CustomNode[]
          };
        }
        return tab;
      })
    );
  }, [activeTabId]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          return {
            ...tab,
            edges: applyEdgeChanges(changes, tab.edges)
          };
        }
        return tab;
      })
    );
  }, [activeTabId]);

  const onConnect = useCallback((connection: Connection) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id !== activeTabId) return tab;

        const sourceNode = tab.nodes.find(n => n.id === connection.source);
        const targetNode = tab.nodes.find(n => n.id === connection.target);
        if (!sourceNode || !targetNode) return tab;

        const incomingCount = tab.edges.filter(e => e.target === connection.target).length;
        if (incomingCount >= 1 && targetNode.type !== 'end') {
          alert('Этот узел уже имеет входящее соединение (разрешён только один вход, кроме END).');
          return tab;
        }
        // исходящих ограничений нет (fan-out разрешён всем)

        // If connection is from a FileUpload node into a ManualTest node, copy filename & preview into target node data (do not copy fileContent)
        const edges = addEdge(connection, tab.edges);
        let nodes = tab.nodes;
        if (sourceNode.type === 'fileUpload' && targetNode.type === 'manualTest') {
          const linkedFileName = sourceNode.data?.fileName || sourceNode.data?.linkedFileName || '';
          const preview = (sourceNode.data?.preview || sourceNode.data?.fileContent || '') as string;
          nodes = tab.nodes.map(n => {
            if (n.id === targetNode.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  fromFile: true,
                  linkedFileName,
                  preview: preview ? preview.slice(0, 500) : undefined,
                  mode: 'openapi'
                }
              };
            }
            return n;
          });
        }

        return {
          ...tab,
          edges,
          nodes
        };
      })
    );
  }, [activeTabId]);

  const resolveNodeCollisions = useCallback(() => {
    setTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === activeTabId) {
          const resolvedNodes = resolveCollisions(tab.nodes, {
            maxIterations: 50,
            overlapThreshold: 0.5,
            margin: 15,
          });
          return {
            ...tab,
            nodes: resolvedNodes,
          };
        }
        return tab;
      })
    );
  }, [activeTabId]);

  return {
    tabs,
    activeTabId,
    nodeCounter,
    copiedNodes,
    isRunning,
    runProgress,
    activeTab,
    nodes,
    edges,
    hasStartNode,
    hasEndNode,
    statisticsModalState,
    
    setTabs,
    setActiveTabId,
    setNodeCounter,
    setCopiedNodes,
    
    generateUniqueTabName,
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
    insertGraph,

    resolveNodeCollisions,
    
    // Функции для работы с модальным окном статистики
    openStatisticsModal,
    closeStatisticsModal,
  };
};