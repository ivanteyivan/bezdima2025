import React, { useState, useEffect } from 'react';
import { ModalBase } from '../ModalBaseComponent';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Tooltip,
  Legend,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts';
import styles from './styles.module.scss';

// Интерфейс статистики сгенерированных тестов
interface TestGenerationStatistics {
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

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: TestGenerationStatistics | null;
}

type TabType = 'overview' | 'priorities' | 'tags' | 'features' | 'testCases';

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  isOpen,
  onClose,
  statistics,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);

  // Отладочный вывод
  useEffect(() => {
    if (statistics) {
      console.log('📊 StatisticsModal received data:', statistics);
      console.log('📝 Total test cases:', statistics.testCases.length);
      
      if (statistics.testCases.length > 0) {
        console.log('🔍 First test case:', statistics.testCases[0]);
        console.log('🔍 Last test case:', statistics.testCases[statistics.testCases.length - 1]);
        
        // Проверка всех тест-кейсов
        statistics.testCases.forEach((testCase, index) => {
          console.log(`Test case ${index + 1}:`, {
            name: testCase.name,
            priority: testCase.priority,
            tags: testCase.tags,
            hasLink: testCase.hasLink,
            jiraId: testCase.jiraId,
            feature: testCase.feature,
            suite: testCase.suite
          });
        });
      }
      
      console.log('🏷️ Tags distribution:', statistics.byTag);
      console.log('🔗 Tests with JIRA links:', statistics.testCases.filter(tc => tc.hasLink).length);
    }
  }, [statistics]);

  if (!statistics) {
    return (
      <ModalBase
        isOpen={isOpen}
        onClose={onClose}
        title="📊 Test Generation Statistics"
        maxWidth="1200px"
        titleColor="#3498db"
      >
        <div className={styles.noData}>
          <p>No test statistics available</p>
          <p>Please generate tests first or connect test nodes</p>
        </div>
      </ModalBase>
    );
  }

  const {
    totalTests,
    byPriority,
    byTag,
    byFeature,
    bySuite,
    testCases
  } = statistics;

  // Подготовка данных для диаграммы приоритетов
  const priorityData = [
    { name: 'High', value: byPriority.high, color: '#ef4444' },
    { name: 'Medium', value: byPriority.medium, color: '#f59e0b' },
    { name: 'Low', value: byPriority.low, color: '#10b981' },
  ].filter(item => item.value > 0);

  // Подготовка данных для диаграммы тегов
  const tagData = Object.entries(byTag)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Подготовка данных для диаграммы функциональностей
  const featureData = Object.entries(byFeature)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Подготовка данных для диаграммы наборов тестов
  const suiteData = Object.entries(bySuite)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Фильтрация тест-кейсов по приоритету
  const filteredTestCases = selectedPriority
    ? testCases.filter(test => test.priority === selectedPriority.toLowerCase())
    : testCases;

  // Статистика по JIRA линкам
  const testsWithJira = testCases.filter(test => test.hasLink).length;
  const jiraCoverage = totalTests > 0 ? Math.round((testsWithJira / totalTests) * 100) : 0;

  // Вспомогательная функция для форматирования меток
  const formatPieLabel = (entry: any) => {
    const name = entry.name || '';
    const value = entry.value || 0;
    const percent = entry.percent || 0;
    return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
  };

  // Вспомогательная функция для форматирования меток приоритетов
  const formatPriorityLabel = (entry: any) => {
    const name = entry.name || '';
    const percent = entry.percent || 0;
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  // Функция для расчета процентов
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="📊 Test Generation Statistics"
      maxWidth="1200px"
      titleColor="#3498db"
    >
      <div className={styles.statisticsContainer}>
        {/* Табы для навигации */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📈 Overview
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'priorities' ? styles.active : ''}`}
            onClick={() => setActiveTab('priorities')}
          >
            🚨 Priorities
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'tags' ? styles.active : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            🏷️ Tags
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'features' ? styles.active : ''}`}
            onClick={() => setActiveTab('features')}
          >
            🎯 Features
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'testCases' ? styles.active : ''}`}
            onClick={() => setActiveTab('testCases')}
          >
            📋 Test Cases
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Основные метрики */}
            <div className={styles.kpiSection}>
              <div className={styles.kpiGrid}>
                <div className={`${styles.kpiCard} ${styles.total}`}>
                  <div className={styles.kpiValue}>{totalTests}</div>
                  <div className={styles.kpiLabel}>Total Tests</div>
                  <div className={styles.kpiSubLabel}>Generated</div>
                </div>
                <div className={`${styles.kpiCard} ${styles.critical}`}>
                  <div className={styles.kpiValue}>{byPriority.high}</div>
                  <div className={styles.kpiLabel}>Critical Tests</div>
                  <div className={styles.kpiPercentage}>
                    {getPercentage(byPriority.high, totalTests)}%
                  </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.linked}`}>
                  <div className={styles.kpiValue}>{testsWithJira}</div>
                  <div className={styles.kpiLabel}>JIRA Linked</div>
                  <div className={styles.kpiPercentage}>
                    {jiraCoverage}%
                  </div>
                </div>
                <div className={`${styles.kpiCard} ${styles.features}`}>
                  <div className={styles.kpiValue}>{Object.keys(byFeature).length}</div>
                  <div className={styles.kpiLabel}>Features</div>
                  <div className={styles.kpiSubLabel}>Covered</div>
                </div>
              </div>
            </div>

            {/* Диаграммы Overview */}
            <div className={styles.chartsGrid}>
              {/* Распределение по приоритетам */}
              <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>Priority Distribution</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={formatPieLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} tests`, 'Count']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Распределение по тегам */}
              <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>Top Tags</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tagData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value} tests`, 'Count']}
                      />
                      <Bar dataKey="value" fill="#8884d8" name="Number of Tests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Распределение по функциональностям */}
              <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>Features Coverage</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={featureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value} tests`, 'Count']}
                      />
                      <Bar dataKey="value" fill="#82ca9d" name="Tests per Feature" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Наборы тестов */}
              <div className={styles.chartContainer}>
                <h3 className={styles.chartTitle}>Test Suites</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={suiteData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value} tests`, 'Count']}
                      />
                      <Bar dataKey="value" fill="#ffc658" name="Tests per Suite" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Tags:</span>
                <span className={styles.statValue}>
                  {Object.keys(byTag).length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Test Suites:</span>
                <span className={styles.statValue}>
                  {Object.keys(bySuite).length}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Avg Tests per Feature:</span>
                <span className={styles.statValue}>
                  {Object.keys(byFeature).length > 0 
                    ? Math.round(totalTests / Object.keys(byFeature).length)
                    : 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>JIRA Coverage:</span>
                <span className={styles.statValue}>
                  {jiraCoverage}%
                </span>
              </div>
            </div>
          </>
        )}

        {/* Priorities Tab */}
        {activeTab === 'priorities' && (
          <div className={styles.prioritiesSection}>
            <div className={styles.priorityFilter}>
              <button
                className={`${styles.filterBtn} ${!selectedPriority ? styles.active : ''}`}
                onClick={() => setSelectedPriority(null)}
              >
                All ({totalTests})
              </button>
              <button
                className={`${styles.filterBtn} ${selectedPriority === 'high' ? styles.active : ''}`}
                onClick={() => setSelectedPriority('high')}
              >
                High ({byPriority.high})
              </button>
              <button
                className={`${styles.filterBtn} ${selectedPriority === 'medium' ? styles.active : ''}`}
                onClick={() => setSelectedPriority('medium')}
              >
                Medium ({byPriority.medium})
              </button>
              <button
                className={`${styles.filterBtn} ${selectedPriority === 'low' ? styles.active : ''}`}
                onClick={() => setSelectedPriority('low')}
              >
                Low ({byPriority.low})
              </button>
            </div>

            <div className={styles.priorityChart}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={formatPriorityLabel}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tests`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.priorityStats}>
              <div className={styles.statCard}>
                <h4>📊 Priority Statistics</h4>
                <div className={styles.statGrid}>
                  <div className={styles.statRow}>
                    <span>High Priority Tests:</span>
                    <span className={styles.highPriority}>{byPriority.high}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Medium Priority Tests:</span>
                    <span className={styles.mediumPriority}>{byPriority.medium}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Low Priority Tests:</span>
                    <span className={styles.lowPriority}>{byPriority.low}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div className={styles.tagsSection}>
            <h3 className={styles.sectionTitle}>📌 Test Tags Distribution</h3>
            <div className={styles.tagsGrid}>
              {Object.entries(byTag).map(([tag, count], index) => (
                <div key={tag} className={styles.tagCard}>
                  <div className={styles.tagHeader}>
                    <span className={styles.tagName}>{tag}</span>
                    <span className={styles.tagCount}>{count}</span>
                  </div>
                  <div className={styles.tagProgress}>
                    <div 
                      className={styles.progressBar}
                      style={{ 
                        width: `${(count / totalTests) * 100}%`,
                        backgroundColor: index % 2 === 0 ? '#3b82f6' : '#8b5cf6'
                      }}
                    />
                  </div>
                  <div className={styles.tagPercentage}>
                    {Math.round((count / totalTests) * 100)}% of all tests
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className={styles.featuresSection}>
            <h3 className={styles.sectionTitle}>🎯 Test Coverage by Feature</h3>
            <div className={styles.featuresChart}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} test cases`, 'Count']}
                    labelFormatter={(label) => `Feature: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Test Cases" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.featuresStats}>
              <div className={styles.statCard}>
                <h4>Feature Coverage Summary</h4>
                <div className={styles.statGrid}>
                  <div className={styles.statRow}>
                    <span>Total Features Covered:</span>
                    <span>{Object.keys(byFeature).length}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Most Covered Feature:</span>
                    <span>
                      {featureData.length > 0 ? featureData[0].name : 'N/A'} 
                      ({featureData.length > 0 ? featureData[0].value : 0} tests)
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Average Tests per Feature:</span>
                    <span>
                      {Object.keys(byFeature).length > 0 
                        ? Math.round(totalTests / Object.keys(byFeature).length)
                        : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === 'testCases' && (
          <div className={styles.testCasesSection}>
            <div className={styles.testCasesHeader}>
              <h3 className={styles.sectionTitle}>
                📋 Generated Test Cases ({filteredTestCases.length})
                {selectedPriority && ` - Priority: ${selectedPriority}`}
              </h3>
              <div className={styles.testCasesStats}>
                <span className={styles.stat}>
                  🏷️ {filteredTestCases.reduce((acc, test) => acc + test.tags.length, 0)} tags
                </span>
                <span className={styles.stat}>
                  🔗 {filteredTestCases.filter(t => t.hasLink).length} JIRA linked
                </span>
              </div>
            </div>

            <div className={styles.testCasesList}>
              <table className={styles.testCasesTable}>
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Priority</th>
                    <th>Tags</th>
                    <th>Feature</th>
                    <th>Suite</th>
                    <th>JIRA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTestCases.map((test, index) => (
                    <tr key={index}>
                      <td className={styles.testName}>{test.name}</td>
                      <td>
                        <span className={`${styles.priorityBadge} ${styles[test.priority]}`}>
                          {test.priority}
                        </span>
                      </td>
                      <td>
                        <div className={styles.tagsList}>
                          {test.tags.map(tag => (
                            <span key={tag} className={styles.tagBadge}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{test.feature}</td>
                      <td>{test.suite}</td>
                      <td>
                        {test.hasLink ? (
                          <span className={styles.jiraLinked}>
                            ✅ {test.jiraId ? `Linked (${test.jiraId})` : 'Linked'}
                          </span>
                        ) : (
                          <span className={styles.jiraMissing}>❌ Missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ModalBase>
  );
};