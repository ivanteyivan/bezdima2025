import { Node, Edge } from '@xyflow/react';

export interface PromptNodeData {
  prompt?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ApiNodeData {
  label?: string;
  createdAt?: string;
  url?: string;
  method?: string;
  responseStatus?: number;
  responseData?: any;
  [key: string]: any;
}

export interface StartNodeData {
  label?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface EndNodeData {
  label?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface ManualTestNodeData {
  requirements?: string;
  feature?: string;
  story?: string;
  owner?: string;
  test_type?: string;
  generated_tests?: string;
  preview?: string;
  specUrl?: string;
  format?: 'auto' | 'json' | 'yaml';
  fromFile?: boolean;
  mode?: 'text' | 'openapi';
  requirements_text?: string;
  openapi_url?: string;
  openapi_format?: 'auto' | 'json' | 'yaml';
  auth_type?: 'none' | 'bearer' | 'header';
  auth_value?: string;
  key_id?: string;
  key_secret?: string;
  bearer_token?: string;
  linkedFileName?: string;
  [key: string]: any;
}

export interface AutomatedTestNodeData {
  test_cases?: string;
  requirements?: string;
  framework?: string;
  openapi_spec?: any;
  base_url?: string;
  generated_code?: string;
  [key: string]: any;
}

export interface OptimizationNodeData {
  test_cases?: string[];
  requirements?: string;
  defect_history?: string;
  coverage?: number;
  duplicates?: number;
  improvements?: string;
  raw_result?: any;
  [key: string]: any;
}

export interface CheckStandardsNodeData {
  test_case?: string;
  test_cases?: string[];
  result?: {
    score: number;
    structure: boolean;
    decorators: boolean;
    aaa_pattern: boolean;
    recommendations: string[];
  };
  [key: string]: any;
}

export interface FileUploadNodeData {
  fileName?: string;
  fileContent?: string;
  uploadedAt?: string;
  [key: string]: any;
}

export interface FileDownloadNodeData {
  artifactName?: string;
  generatedAt?: string;
  payload?: string;
  [key: string]: any;
}

// Статистика по сгенерированным тестам
export interface TestGenerationStatistics {
  totalTests: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byTag: {
    [key: string]: number;
  };
  byFeature: {
    [key: string]: number;
  };
  bySuite: {
    [key: string]: number;
  };
  testCases: Array<{
    name: string;
    priority: string;
    tags: string[];
    feature: string;
    suite: string;
    hasLink: boolean;
    jiraId?: string;
  }>;
}

export interface StatisticsNodeData {
  rawData?: string;
  statistics?: {
    total?: number;
    passed?: number;
    failed?: number;
    broken?: number;
    skipped?: number;
    unknown?: number;
    duration?: number;
    categories?: Array<{
      name: string;
      passed: number;
      failed: number;
      broken: number;
      skipped: number;
      unknown: number;
      total: number;
    }>;
    suites?: Array<{
      name: string;
      total: number;
      passed: number;
      failed: number;
      duration: number;
    }>;
    trends?: Array<{
      date: string;
      total: number;
      passed: number;
      failed: number;
      successRate: number;
    }>;
    executionTimeDistribution?: Array<{
      range: string;
      count: number;
    }>;
  };
  // Новая структура для статистики сгенерированных тестов
  generationStatistics?: TestGenerationStatistics;
  generatedAt?: string;
  createdAt?: string;
  preview?: string;
  status?: 'pending' | 'processing' | 'ready' | 'error';
  [key: string]: any;
}

export interface TestResultData {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped' | 'unknown';
  duration: number;
  timestamp: string;
  category?: string;
  suite?: string;
  tags?: string[];
  errorMessage?: string;
}

export interface AllureTestCase {
  name: string;
  status: 'passed' | 'failed' | 'broken' | 'skipped' | 'unknown';
  duration: number;
  steps: Array<{
    name: string;
    status: string;
    duration: number;
  }>;
  attachments: Array<{
    name: string;
    type: string;
    size: number;
  }>;
  labels: Array<{
    name: string;
    value: string;
  }>;
}

export interface AllureReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    broken: number;
    skipped: number;
    unknown: number;
    duration: number;
  };
  categories: Array<{
    name: string;
    passed: number;
    failed: number;
    broken: number;
    skipped: number;
    unknown: number;
    total: number;
  }>;
  suites: Array<{
    name: string;
    total: number;
    passed: number;
    failed: number;
    duration: number;
  }>;
  testCases: AllureTestCase[];
  trends?: Array<{
    date: string;
    total: number;
    passed: number;
    failed: number;
    successRate: number;
  }>;
  executionTimeDistribution?: Array<{
    range: string;
    count: number;
  }>;
}

export type PromptNode = Node<PromptNodeData>;
export type ApiNode = Node<ApiNodeData>;
export type StartNode = Node<StartNodeData>;
export type EndNode = Node<EndNodeData>;
export type ManualTestNode = Node<ManualTestNodeData>;
export type AutomatedTestNode = Node<AutomatedTestNodeData>;
export type OptimizationNode = Node<OptimizationNodeData>;
export type CheckStandardsNode = Node<CheckStandardsNodeData>;
export type FileUploadNode = Node<FileUploadNodeData>;
export type FileDownloadNode = Node<FileDownloadNodeData>;
export type StatisticsNode = Node<StatisticsNodeData>;

export type CustomNode = 
  | PromptNode 
  | ApiNode 
  | StartNode 
  | EndNode 
  | ManualTestNode 
  | AutomatedTestNode 
  | OptimizationNode 
  | CheckStandardsNode 
  | FileUploadNode 
  | FileDownloadNode
  | StatisticsNode;

export type CustomEdge = Edge;

export interface Tab {
  id: string;
  label: string;
  nodes: CustomNode[];
  edges: CustomEdge[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface AgentStreamEvent {
  type: 'chunk' | 'done' | 'error' | 'meta';
  content?: string;
  session_id?: string;
  graph?: any;
  steps?: string[];
  retrieval_sources?: string[];
  [key: string]: any;
}

export interface FlowConfig {
  nodes: CustomNode[];
  edges: CustomEdge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
}

export interface ModalState {
  isOpen: boolean;
  nodeId?: string;
  nodeType?: string;
  nodeData?: any;
}

export interface ConnectionData {
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface StatisticsProcessor {
  processResults(testResults: TestResultData[]): StatisticsNodeData['statistics'];
  generateChartsData(statistics: StatisticsNodeData['statistics']): {
    pieChartData: any[];
    barChartData: any[];
    timelineData: any[];
    executionTimeData: any[];
  };
  calculateMetrics(statistics: StatisticsNodeData['statistics']): {
    successRate: number;
    stabilityScore: number;
    avgDuration: number;
    failRate: number;
  };
}

export const TEST_STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
  BROKEN: 'broken',
  SKIPPED: 'skipped',
  UNKNOWN: 'unknown'
} as const;

export type TestStatus = typeof TEST_STATUS[keyof typeof TEST_STATUS];

export const STATUS_COLORS = {
  passed: '#10b981',
  failed: '#ef4444',
  broken: '#f59e0b',
  skipped: '#6b7280',
  unknown: '#9ca3af'
} as const;

export const StatisticsUtils = {
  calculatePercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  },

  formatDuration(seconds: number): string {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    } else if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
  },

  generatePieChartData(statistics: StatisticsNodeData['statistics']): Array<{
    name: string;
    value: number;
    color: string;
  }> {
    if (!statistics) return [];
    
    return [
      { name: 'Passed', value: statistics.passed || 0, color: '#10b981' },
      { name: 'Failed', value: statistics.failed || 0, color: '#ef4444' },
      { name: 'Broken', value: statistics.broken || 0, color: '#f59e0b' },
      { name: 'Skipped', value: statistics.skipped || 0, color: '#6b7280' },
      { name: 'Unknown', value: statistics.unknown || 0, color: '#9ca3af' },
    ].filter(item => item.value > 0);
  },

  generateLineChartData(statistics: StatisticsNodeData['statistics']): Array<{
    date: string;
    successRate: number;
    total: number;
    passed: number;
  }> {
    if (!statistics?.trends) return [];
    
    return statistics.trends.map(trend => ({
      date: trend.date,
      successRate: trend.successRate,
      total: trend.total,
      passed: trend.passed
    }));
  },

  generateBarChartData(statistics: StatisticsNodeData['statistics']): Array<{
    name: string;
    passed: number;
    failed: number;
    successRate: number;
    duration: number;
  }> {
    if (!statistics?.suites) return [];
    
    return statistics.suites.slice(0, 10).map(suite => ({
      name: suite.name.length > 20 ? suite.name.substring(0, 20) + '...' : suite.name,
      passed: suite.passed,
      failed: suite.failed,
      successRate: StatisticsUtils.calculatePercentage(suite.passed, suite.total),
      duration: suite.duration
    }));
  },

  generateExecutionTimeData(statistics: StatisticsNodeData['statistics']): Array<{
    range: string;
    count: number;
  }> {
    if (statistics?.executionTimeDistribution && statistics.executionTimeDistribution.length > 0) {
      return statistics.executionTimeDistribution;
    }
    
    return [
      { range: '0-1s', count: Math.floor(Math.random() * 20) + 10 },
      { range: '1-5s', count: Math.floor(Math.random() * 30) + 20 },
      { range: '5-10s', count: Math.floor(Math.random() * 15) + 5 },
      { range: '10-30s', count: Math.floor(Math.random() * 10) + 3 },
      { range: '30s+', count: Math.floor(Math.random() * 5) + 1 },
    ];
  },

  // Новые утилиты для статистики сгенерированных тестов
  generateTestGenerationStats(testCases: string): TestGenerationStatistics | null {
    try {
      // Парсинг тестов из строки
      const lines = testCases.split('\n');
      const testCaseObjects: Array<{
        name: string;
        priority: string;
        tags: string[];
        feature: string;
        suite: string;
        hasLink: boolean;
        jiraId?: string;
      }> = [];
      
      // Простой парсер для извлечения информации из тестов
      let currentTest: {
        name: string;
        priority: string;
        tags: string[];
        feature: string;
        suite: string;
        hasLink: boolean;
        jiraId?: string;
      } = {
        name: '',
        priority: 'medium',
        tags: [],
        feature: 'Unknown',
        suite: 'api',
        hasLink: false,
        jiraId: undefined
      };
      
      let insideTest = false;
      let lastDecoratorLine = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Поиск начала тестовой функции
        if (line.trim().startsWith('def test_')) {
          // Если у нас есть текущий тест, сохраняем его
          if (currentTest.name && insideTest) {
            testCaseObjects.push({ ...currentTest });
          }
          
          const testNameMatch = line.trim().match(/def (test_[^(:]+)/);
          const testName = testNameMatch ? testNameMatch[1] : 'Unknown';
          
          // Сбрасываем текущий тест
          currentTest = {
            name: testName,
            priority: 'medium',
            tags: [],
            feature: 'Unknown',
            suite: 'api',
            hasLink: false,
            jiraId: undefined
          };
          
          insideTest = true;
          lastDecoratorLine = i;
          
          // Просматриваем предыдущие строки для поиска декораторов (максимум 10 строк)
          for (let j = Math.max(0, i - 1); j >= Math.max(0, i - 10); j--) {
            const decoratorLine = lines[j].trim();
            
            if (decoratorLine.startsWith('@')) {
              // Приоритет
              if (decoratorLine.includes('@allure.label("priority"')) {
                const priorityMatch = decoratorLine.match(/"priority",\s*"([^"]+)"/);
                if (priorityMatch) {
                  currentTest.priority = priorityMatch[1].toLowerCase();
                }
              }
              
              // Теги
              if (decoratorLine.includes('@allure.tag(')) {
                const tagMatches = decoratorLine.matchAll(/"([^"]+)"/g);
                for (const match of tagMatches) {
                  const tag = match[1];
                  if (tag && !currentTest.tags.includes(tag)) {
                    currentTest.tags.push(tag);
                  }
                }
              }
              
              // Функциональность
              if (decoratorLine.includes('@allure.feature(')) {
                const featureMatch = decoratorLine.match(/"([^"]+)"/);
                if (featureMatch) {
                  currentTest.feature = featureMatch[1];
                }
              }
              
              // Набор тестов
              if (decoratorLine.includes('@allure.suite(')) {
                const suiteMatch = decoratorLine.match(/"([^"]+)"/);
                if (suiteMatch) {
                  currentTest.suite = suiteMatch[1];
                }
              }
              
              // JIRA ссылки
              if (decoratorLine.includes('@allure.link(')) {
                currentTest.hasLink = true;
                const jiraMatch = decoratorLine.match(/browse\/([^")\s]+)/);
                if (jiraMatch) {
                  currentTest.jiraId = jiraMatch[1];
                }
              }
            } else if (decoratorLine === '' && j < i - 1) {
              // Пустая строка означает конец декораторов для этого теста
              break;
            }
          }
        }
        
        // Если мы внутри теста, ищем декораторы сразу после определения функции
        if (insideTest && i > lastDecoratorLine) {
          const trimmedLine = line.trim();
          
          // Проверяем конец теста (новая функция или конец файла)
          if (trimmedLine.startsWith('def ') && trimmedLine.startsWith('def test_')) {
            // Новый тест начинается - сохраняем текущий
            if (currentTest.name) {
              testCaseObjects.push({ ...currentTest });
            }
            continue;
          }
          
          // Проверяем наличие декораторов внутри теста (редко, но бывает)
          if (trimmedLine.startsWith('@')) {
            // Приоритет
            if (trimmedLine.includes('@allure.label("priority"')) {
              const priorityMatch = trimmedLine.match(/"priority",\s*"([^"]+)"/);
              if (priorityMatch) {
                currentTest.priority = priorityMatch[1].toLowerCase();
              }
            }
            
            // Теги
            if (trimmedLine.includes('@allure.tag(')) {
              const tagMatches = trimmedLine.matchAll(/"([^"]+)"/g);
              for (const match of tagMatches) {
                const tag = match[1];
                if (tag && !currentTest.tags.includes(tag)) {
                  currentTest.tags.push(tag);
                }
              }
            }
          }
          
          // Проверяем конец теста по наличию return или концу функции
          if (trimmedLine.includes('return ') || (trimmedLine === '' && i > lastDecoratorLine + 5)) {
            // Если пустая строка после нескольких строк кода, возможно, тест закончился
          }
        }
      }
      
      // Добавляем последний тест, если он есть
      if (currentTest.name && insideTest) {
        testCaseObjects.push({ ...currentTest });
      }

      // Отладочный вывод
      console.log('Parsed test cases:', testCaseObjects);
      console.log('Last test case:', testCaseObjects[testCaseObjects.length - 1]);

      // Подсчет статистики
      const byPriority = {
        high: testCaseObjects.filter(t => t.priority === 'high').length,
        medium: testCaseObjects.filter(t => t.priority === 'medium').length,
        low: testCaseObjects.filter(t => t.priority === 'low').length
      };

      const byTag: { [key: string]: number } = {};
      const byFeature: { [key: string]: number } = {};
      const bySuite: { [key: string]: number } = {};

      testCaseObjects.forEach(test => {
        test.tags.forEach((tag: string) => {
          byTag[tag] = (byTag[tag] || 0) + 1;
        });
        byFeature[test.feature] = (byFeature[test.feature] || 0) + 1;
        bySuite[test.suite] = (bySuite[test.suite] || 0) + 1;
      });

      return {
        totalTests: testCaseObjects.length,
        byPriority,
        byTag,
        byFeature,
        bySuite,
        testCases: testCaseObjects
      };
    } catch (error) {
      console.error('Error generating test statistics:', error);
      return null;
    }
  }
};

export interface AppContextType {
  nodes: CustomNode[];
  edges: CustomEdge[];
  selectedNode: CustomNode | null;
  modalState: ModalState;
  updateNodeData: (nodeId: string, data: any) => void;
  openModal: (modalConfig: Partial<ModalState>) => void;
  closeModal: () => void;
}

export interface NodeEvent {
  type: 'click' | 'doubleClick' | 'contextMenu';
  nodeId: string;
  nodeType: string;
  data: any;
  timestamp: Date;
}

export interface EdgeEvent {
  type: 'connect' | 'disconnect' | 'click';
  edgeId: string;
  source: string;
  target: string;
  timestamp: Date;
}

// Agent chat types - client
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentChatResponse {
  answer: string;
  steps?: string[];
  retrieval_sources?: string[];
}

export interface ADKGraphNode {
  id: string;
  type: string;
  data?: any;
  position?: { x: number; y: number };
}

export interface ADKGraphEdge {
  id?: string;
  source: string;
  target: string;
  data?: any;
}

export interface ADKChatResponse {
  answer: string;
  session_id?: string;
  graph?: { nodes: ADKGraphNode[]; edges?: ADKGraphEdge[] };
  steps?: string[];
  retrieval_sources?: string[];
}

export type KnowledgeBaseItem = { source?: string; text: string };