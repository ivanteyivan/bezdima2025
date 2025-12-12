import React, { useState, useEffect } from 'react';
import { OptimizationNodeData } from '../../../types';
import { optimizeTests } from '../../../api';
import { ModalBase } from '../ModalBaseComponent/ModalBase';
import styles from './styles.module.scss';

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialData: OptimizationNodeData;
  onSave: (nodeId: string, data: OptimizationNodeData) => void;
  hasFileUploadConnection?: boolean;
  fileName?: string;
  fileContent?: string;
}

export const OptimizationModal: React.FC<OptimizationModalProps> = ({ 
  isOpen, 
  onClose, 
  nodeId, 
  initialData, 
  onSave,
  hasFileUploadConnection,
  fileName,
  fileContent
}) => {
  const [requirements, setRequirements] = useState(initialData.requirements || '');
  const [defectHistory, setDefectHistory] = useState(initialData.defect_history || '');
  const [result, setResult] = useState<any | null>(initialData.result || null);
  const [showRawResult, setShowRawResult] = useState(false);
  const [localTestCasesInput, setLocalTestCasesInput] = useState('');
  const [currentTestCases, setCurrentTestCases] = useState<any[]>(initialData.test_cases || []);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [editedTestCasesText, setEditedTestCasesText] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const testCases = initialData.test_cases || [];
  const hasInputTests = currentTestCases.length > 0;
  const actualFileContent = fileContent || initialData.requirements_fileContent || '';
  const actualFileName = fileName || initialData.requirements_fileName || initialData.linkedFileName || '';
  const showFileLocked = (hasFileUploadConnection || !!initialData.fromFile) && !!actualFileContent;
  const [localPreview, setLocalPreview] = useState<string | null>(actualFileContent || initialData.preview || null);
  
  useEffect(() => {
    if (isOpen) {
      setRequirements(initialData.requirements || '');
      setDefectHistory(initialData.defect_history || '');
      setLocalPreview(actualFileContent || initialData.preview || null);
      setIsEditingExisting(false);
      setEditedTestCasesText('');
      setResult(initialData.raw_result || initialData.result || null);
      setCurrentTestCases(initialData.test_cases || []);
    }
  }, [isOpen, initialData]);
  
  const handleSave = () => {
    if (nodeId) {
      // Determine test cases: prefer existing testCases, then file content if present, then manual input
      let finalTestCases: any[] = [];
      if (currentTestCases && currentTestCases.length > 0 && !isEditingExisting) {
        finalTestCases = currentTestCases;
      } else if (isEditingExisting && editedTestCasesText) {
        // try parse edited text as JSON array
        const txt = editedTestCasesText.trim();
        if (txt.startsWith('[')) {
          try {
            const parsed = JSON.parse(txt);
            if (Array.isArray(parsed) && parsed.length > 0) finalTestCases = parsed;
          } catch (e) {}
        }
        if (finalTestCases.length === 0) {
          const parts = txt.split(/\n\n+|\r\n\r\n+|\n+/).map(s => s.trim()).filter(Boolean);
          if (parts.length > 0) finalTestCases = parts;
        }
      } else if (currentTestCases && currentTestCases.length > 0) {
        finalTestCases = currentTestCases;
      } else if (showFileLocked && actualFileContent) {
        // try JSON array
        try {
          const parsed = JSON.parse(actualFileContent);
          if (Array.isArray(parsed) && parsed.length > 0) finalTestCases = parsed;
        } catch (e) {
          // fallback: split by double newlines or single lines
          const parts = actualFileContent.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
          if (parts.length > 0) finalTestCases = parts;
        }
      } else if (localTestCasesInput) {
        const txt = localTestCasesInput.trim();
        if (txt.startsWith('[')) {
          try {
            const parsed = JSON.parse(txt);
            if (Array.isArray(parsed) && parsed.length > 0) finalTestCases = parsed;
          } catch (e) {
            // invalid JSON
          }
        }
        if (finalTestCases.length === 0) {
          const parts = txt.split(/\n\n+|\r\n\r\n+|\n+/).map(s => s.trim()).filter(Boolean);
          if (parts.length > 0) finalTestCases = parts;
        }
      }

      if (!finalTestCases || finalTestCases.length === 0) {
        setSaveError('Нужно указать хотя бы один тест-кейс (файл или ручной ввод)');
        return;
      }

      const data: OptimizationNodeData = {
        test_cases: finalTestCases,
        defect_history: defectHistory,
        createdAt: initialData.createdAt || new Date().toISOString(),
        ...(result ? { raw_result: result } : {})
      } as OptimizationNodeData;

      if (showFileLocked && actualFileContent) {
        data.requirements_fileName = actualFileName;
        data.requirements_fileContent = actualFileContent;
        data.requirements = (localPreview || actualFileContent || '').slice(0, 1000);
      } else {
        data.requirements = requirements;
      }

      setSaveError(null);
      onSave(nodeId, data);
      onClose();
    }
  };

  // Execution is performed by the flow runner when the graph reaches this node.

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };
  
  if (!isOpen || !nodeId) return null;
  
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Анализ и оптимизация тестов"
      titleColor="darkorange"
      maxWidth="800px"
    >
      <div className={styles.container}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Список существующих тест-кейсов:
            <span className={styles.testCount}>
              {hasInputTests ? `${currentTestCases.length} тестов получено` : 'Нет подключенных тестов'}
            </span>
          </label>
          {hasInputTests && (
            <div className={styles.testCasesPreview}>
              {currentTestCases.slice(0, 8).map((testCase, index) => (
                <div key={index} className={styles.testCasePreview}>
                  <div className={styles.testCaseIndex}>Тест #{index + 1}</div>
                  <pre className={styles.testCaseContent}>
                    {typeof testCase === 'string' ? (testCase.length > 300 ? testCase.substring(0, 300) + '...' : testCase) : JSON.stringify(testCase, null, 2).substring(0, 300) + '...'}
                  </pre>
                </div>
              ))}
              {currentTestCases.length > 8 && <div className={styles.moreTestsMessage}>... и ещё {currentTestCases.length - 8} тестов</div>}
              <div className={styles.editControls}>
                {!isEditingExisting ? (
                  <button
                    className={styles.smallButton}
                    onClick={() => {
                      const text = JSON.stringify(testCases, null, 2);
                      setEditedTestCasesText(text);
                      setIsEditingExisting(true);
                    }}
                  >Edit</button>
                ) : (
                  <>
                    <button
                      className={styles.smallButton}
                      onClick={() => setIsEditingExisting(false)}
                    >Cancel</button>
                    <button
                      className={styles.smallButton}
                      onClick={() => setIsEditingExisting(false)}
                    >Apply</button>
                  </>
                )}
              </div>
            </div>
          )}
          {isEditingExisting && (
            <div className={styles.manualTestsInput}>
              <label className={styles.label}>Редактировать тест-кейсы (JSON-массив или по строкам):</label>
              <textarea
                value={editedTestCasesText}
                onChange={(e) => setEditedTestCasesText(e.target.value)}
                className={styles.textarea}
                rows={8}
              />
            </div>
          )}
          {!hasInputTests && (
            <div className={styles.manualTestsInput}>
              <label className={styles.label}>Ввести тест-кейсы вручную (по одному на строку или JSON-массив):</label>
              <textarea
                value={localTestCasesInput}
                onChange={(e) => setLocalTestCasesInput(e.target.value)}
                className={styles.textarea}
                placeholder={`Тест1\nТест2\n... или ["test1","test2"]`}
                rows={6}
              />
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Описание требований (чтобы понять, что должно быть покрыто):</label>
          {showFileLocked && localPreview ? (
            <div className={styles.filePreviewBox}>
              <div className={styles.filePreviewHeader}>Источник требований: {actualFileName || 'Файл'}</div>
              <pre className={styles.filePreviewContent}>{localPreview.slice(0, 1000)}{localPreview.length > 1000 ? '...' : ''}</pre>
            </div>
          ) : (
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.textarea}
              placeholder="Опишите требования..."
              rows={5}
            />
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>История дефектов (опционально):</label>
          <textarea
            value={defectHistory}
            onChange={(e) => setDefectHistory(e.target.value)}
            className={styles.textarea}
            placeholder="Опишите кратко историю дефектов, если есть..."
            rows={4}
          />
        </div>

        <div className={styles.buttonGroup}>
          {saveError && <div className={styles.saveError}>{saveError}</div>}
          <button onClick={handleSave} className={styles.saveButton}>Сохранить</button>
        </div>
        {result && (
          <div className={styles.resultPanel}>
            <div className={styles.resultHeader}>
              <div className={styles.resultTitle}>Результат оптимизации</div>
              <div className={styles.resultMeta}>Last run: {initialData.lastRunAt ? new Date(initialData.lastRunAt).toLocaleString() : '—'}</div>
            </div>
            <div className={styles.metricsRow}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Coverage</div>
                <div className={styles.metricValue}>
                  {(typeof result.coverage === 'number') ? `${result.coverage}` : (
                    typeof result.coverage === 'object' && result.coverage?.total_tests ? `${result.coverage.total_tests}` : '—'
                  )}
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Duplicates</div>
                <div className={styles.metricValue}>
                  {Array.isArray(result.duplicates) ? result.duplicates.length : (result.duplicates ?? '—')}
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Improvements</div>
                <div className={styles.metricValue}>{Array.isArray(result.improvements) ? result.improvements.length : (result.improvements ? 1 : 0)}</div>
              </div>
            </div>
            <div className={styles.improvementsList}>
              <div className={styles.improvementsTitle}>Recommendations:</div>
              {Array.isArray(result.improvements) && result.improvements.length > 0 ? (
                <ul>
                  {result.improvements.map((imp: any, idx: number) => (
                    <li key={idx} className={styles.improvementItem}>{typeof imp === 'string' ? imp : JSON.stringify(imp)}</li>
                  ))}
                </ul>
              ) : (
                <div className={styles.noImprovements}>No improvements suggested</div>
              )}
            </div>
            <div className={styles.rawControls}>
              <button className={styles.smallButton} onClick={() => setShowRawResult(!showRawResult)}>{showRawResult ? 'Hide raw' : 'View raw'}</button>
            </div>
            {showRawResult && (
              <pre className={styles.rawResultBox}>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </ModalBase>
  );
};