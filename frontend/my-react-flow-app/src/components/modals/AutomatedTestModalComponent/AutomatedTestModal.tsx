import React, { useState, useEffect } from 'react';
import { AutomatedTestNodeData } from '../../../types';
import { ModalBase } from '../ModalBaseComponent/ModalBase';
import styles from './styles.module.scss';
import { generateApiTests, generateUiTests } from '../../../api';

interface AutomatedTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialData: AutomatedTestNodeData;
  onSave: (nodeId: string, data: AutomatedTestNodeData) => void;
}

export const AutomatedTestModal: React.FC<AutomatedTestModalProps> = ({ 
  isOpen, 
  onClose, 
  nodeId, 
  initialData, 
  onSave 
}) => {
  const [testCases, setTestCases] = useState(initialData.test_cases || '');
  const [requirements, setRequirements] = useState(initialData.requirements || '');
  const [framework, setFramework] = useState(initialData.framework || 'selenium');
  const [baseUrl, setBaseUrl] = useState(initialData.base_url || '');
  const [generatedCode, setGeneratedCode] = useState(initialData.generated_code || '');
  const [openapiSpec, setOpenapiSpec] = useState(initialData.openapi_spec || null);
  
  useEffect(() => {
    if (isOpen) {
      setTestCases(initialData.test_cases || '');
      setRequirements(initialData.requirements || '');
      setFramework(initialData.framework || 'selenium');
      setBaseUrl(initialData.base_url || '');
      setGeneratedCode(initialData.generated_code || '');
      setOpenapiSpec(initialData.openapi_spec || null);
    }
  }, [isOpen, initialData]);
  
  const handleSave = () => {
    if (nodeId) {
      onSave(nodeId, {
        test_cases: testCases,
        requirements,
        framework,
        base_url: baseUrl,
        generated_code: generatedCode,
        openapi_spec: openapiSpec,
        createdAt: initialData.createdAt || new Date().toISOString()
      });
      onClose();
    }
  };

  const handleGenerateCode = () => {
    const doUi = !openapiSpec;
    const action = doUi
      ? generateUiTests({
          test_cases: testCases,
          requirements,
          framework
        })
      : generateApiTests({
          openapi_spec: openapiSpec,
          test_cases: testCases,
          base_url: baseUrl
        });

    action
      .then(res => {
        const code = (res as any).code || '';
        setGeneratedCode(code);
        // Persist generated code into node immediately so users can see/keep it
        if (nodeId && code) {
          onSave(nodeId, {
            generated_code: code,
            generatedAt: new Date().toISOString(),
            preview: code.slice(0, 500)
          });
        }
      })
      .catch(err => {
        setGeneratedCode('');
        alert(`Generation error: ${err instanceof Error ? err.message : String(err)}`);
      });
  };

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
      title="Automated Testing"
      titleColor="midnightblue"
      maxWidth="800px"
    >
      <div className={styles.container}>
        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Framework:</label>
            <select
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              className={styles.select}
            >
              <option value="selenium">Selenium</option>
              <option value="pytest">Pytest</option>
              <option value="playwright">Playwright</option>
              <option value="cypress">Cypress</option>
              <option value="testng">TestNG</option>
              <option value="junit">JUnit</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Base URL:</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className={styles.input}
              placeholder="https://api.example.com"
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Test cases (optional):</label>
          <textarea
            value={testCases}
            onChange={(e) => setTestCases(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.textarea}
            placeholder="Enter test cases in Allure format or leave empty..."
          />
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.label}>Additional requirements:</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className={styles.textarea}
            placeholder="Additional requirements for test generation..."
          />
        </div>
        
        <div className={styles.buttonGroup}>
          <button
            onClick={handleGenerateCode}
            className={styles.generateButton}
          >
            Generate code
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
          >
            Save
          </button>
        </div>
        
        {generatedCode && (
          <div className={styles.codeSection}>
            <label className={styles.label}>Generated code:</label>
            <pre className={styles.codeBlock}>
              {generatedCode}
            </pre>
          </div>
        )}
      </div>
    </ModalBase>
  );
};