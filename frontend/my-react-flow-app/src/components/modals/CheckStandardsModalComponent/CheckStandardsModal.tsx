import React, { useState, useEffect } from 'react';
import { CheckStandardsNodeData } from '../../../types';
import { ModalBase } from '../ModalBaseComponent/ModalBase';
import styles from './styles.module.scss';
import { checkStandards } from '../../../api';

interface CheckStandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialData: CheckStandardsNodeData;
  onSave: (nodeId: string, data: CheckStandardsNodeData) => void;
}

export const CheckStandardsModal: React.FC<CheckStandardsModalProps> = ({ 
  isOpen, 
  onClose, 
  nodeId, 
  initialData, 
  onSave 
}) => {
  const [singleTestCase, setSingleTestCase] = useState(initialData.test_case || '');
  const [multipleTestCases, setMultipleTestCases] = useState<string[]>(initialData.test_cases || []);
  const [checkType, setCheckType] = useState<'single' | 'multiple'>(initialData.test_case ? 'single' : 'multiple');
  const [result, setResult] = useState(initialData.result || null);
  const [newTestCase, setNewTestCase] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setSingleTestCase(initialData.test_case || '');
      setMultipleTestCases(initialData.test_cases || []);
      setCheckType(initialData.test_case ? 'single' : 'multiple');
      setResult(initialData.result || null);
      setNewTestCase('');
    }
  }, [isOpen, initialData]);
  
  const handleSave = () => {
    if (nodeId) {
      const data: CheckStandardsNodeData = {
        createdAt: initialData.createdAt || new Date().toISOString()
      };
      
      if (checkType === 'single') {
        data.test_case = singleTestCase;
      } else {
        data.test_cases = multipleTestCases;
      }
      
      if (result) {
        data.result = result;
      }
      
      onSave(nodeId, data);
      onClose();
    }
  };

  const handleCheckStandards = () => {
    const payload = checkType === 'single'
      ? { test_case: singleTestCase }
      : { test_cases: multipleTestCases };
    checkStandards(payload)
      .then(res => {
        setResult(res.result);
      })
      .catch(err => {
        alert(`Check error: ${err instanceof Error ? err.message : String(err)}`);
      });
  };

  const handleAddTestCase = () => {
    if (newTestCase.trim()) {
      setMultipleTestCases(prev => [...prev, newTestCase.trim()]);
      setNewTestCase('');
    }
  };

  const handleRemoveTestCase = (index: number) => {
    setMultipleTestCases(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };
  
  if (!isOpen || !nodeId) return null;
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'orange';
    return 'red';
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Standards Check"
      titleColor="darkviolet"
      maxWidth="800px"
    >
      <div className={styles.container}>
        <div className={styles.checkTypeSection}>
          <label className={styles.sectionLabel}>Check type:</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={checkType === 'single'}
                onChange={() => setCheckType('single')}
              />
              Single test case
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                checked={checkType === 'multiple'}
                onChange={() => setCheckType('multiple')}
              />
              Multiple test cases
            </label>
          </div>
        </div>
        
        {checkType === 'single' ? (
          <div className={styles.formGroup}>
            <label className={styles.sectionLabel}>Test case:</label>
            <textarea
              value={singleTestCase}
              onChange={(e) => setSingleTestCase(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.testCaseTextarea}
              placeholder="Enter test case code for checking..."
            />
          </div>
        ) : (
          <div className={styles.formGroup}>
            <label className={styles.sectionLabel}>
              Test cases ({multipleTestCases.length}):
            </label>
            <div className={styles.addTestCaseContainer}>
              <input
                type="text"
                value={newTestCase}
                onChange={(e) => setNewTestCase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTestCase()}
                className={styles.testCaseInput}
                placeholder="Add test case..."
              />
              <button
                onClick={handleAddTestCase}
                className={styles.addButton}
              >
                Add
              </button>
            </div>
            
            <div className={styles.testCasesList}>
              {multipleTestCases.length === 0 ? (
                <div className={styles.emptyList}>No test cases</div>
              ) : (
                multipleTestCases.map((testCase, index) => (
                  <div
                    key={index}
                    className={styles.testCaseItem}
                  >
                    <span className={styles.testCaseText}>
                      {testCase.length > 50 ? testCase.substring(0, 50) + '...' : testCase}
                    </span>
                    <button
                      onClick={() => handleRemoveTestCase(index)}
                      className={styles.removeButton}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        <div className={styles.buttonGroup}>
          <button
            onClick={handleCheckStandards}
            className={styles.checkButton}
          >
            Check standards
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
          >
            Save
          </button>
        </div>
        
        {result && (
          <div className={styles.resultSection}>
            <label className={styles.sectionLabel}>Check result:</label>
            <div className={styles.resultContainer}>
              <div className={styles.resultHeader}>
                <div className={styles.scoreSection}>
                  <div className={styles.scoreLabel}>Overall score</div>
                  <div 
                    className={styles.scoreValue}
                    style={{ color: getScoreColor(result.score) }}
                  >
                    {result.score}/100
                  </div>
                </div>
                <div className={styles.indicators}>
                  <div className={styles.indicator}>
                    <div className={styles.indicatorLabel}>Structure</div>
                    <div className={styles.indicatorIcon} style={{ color: result.structure ? 'green' : 'red' }}>
                      {result.structure ? 'Pass' : 'Fail'}
                    </div>
                  </div>
                  <div className={styles.indicator}>
                    <div className={styles.indicatorLabel}>Decorators</div>
                    <div className={styles.indicatorIcon} style={{ color: result.decorators ? 'green' : 'red' }}>
                      {result.decorators ? 'Pass' : 'Fail'}
                    </div>
                  </div>
                  <div className={styles.indicator}>
                    <div className={styles.indicatorLabel}>AAA pattern</div>
                    <div className={styles.indicatorIcon} style={{ color: result.aaa_pattern ? 'green' : 'red' }}>
                      {result.aaa_pattern ? 'Pass' : 'Fail'}
                    </div>
                  </div>
                </div>
              </div>
              
              {result.recommendations && result.recommendations.length > 0 && (
                <div className={styles.recommendations}>
                  <div className={styles.recommendationsTitle}>Recommendations:</div>
                  <ul className={styles.recommendationsList}>
                    {result.recommendations.map((rec: string, index: number) => (
                      <li key={index} className={styles.recommendationItem}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalBase>
  );
};