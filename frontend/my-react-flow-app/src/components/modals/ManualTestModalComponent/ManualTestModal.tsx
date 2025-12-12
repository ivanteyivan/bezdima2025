import React, { useState, useEffect } from 'react';
import { ManualTestNodeData } from '../../../types';
import { ModalBase } from '../ModalBaseComponent/ModalBase';
// @ts-ignore - css modules
import styles from './styles.module.scss';

interface ManualTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
  initialData: ManualTestNodeData;
  onSave: (nodeId: string, data: ManualTestNodeData) => void;
  hasFileUploadConnection?: boolean;
  fileName?: string;
  fileContent?: string;
}

export const ManualTestModal: React.FC<ManualTestModalProps> = ({ 
  isOpen, 
  onClose, 
  nodeId, 
  initialData, 
  onSave,
  hasFileUploadConnection = false,
  fileName,
  fileContent
}) => {
  const [feature, setFeature] = useState(initialData.feature || '');
  const [story, setStory] = useState(initialData.story || '');
  const [owner, setOwner] = useState(initialData.owner || '');
  const [testType] = useState('api');
  const [mode, setMode] = useState<'text' | 'openapi'>(initialData.mode || 'text');
  const [requirementsText, setRequirementsText] = useState(initialData.requirements_text || '');
  const [specUrl, setSpecUrl] = useState(initialData.openapi_url || initialData.specUrl || '');
  const [format, setFormat] = useState<'auto' | 'json' | 'yaml'>(initialData.openapi_format || initialData.format || 'auto');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'header'>(initialData.auth_type || 'none');
  const [authValue, setAuthValue] = useState(initialData.auth_value || '');
  const [keyId, setKeyId] = useState(initialData.key_id || '');
  const [keySecret, setKeySecret] = useState(initialData.key_secret || '');
  
  // Используем fileContent если он передан из пропсов
  const actualFileContent = fileContent || initialData.fileContent;
  const actualFileName = fileName || initialData.linkedFileName || initialData.fileName;
  const actualHasFileUploadConnection = hasFileUploadConnection || !!actualFileContent || initialData.fromFile;
  const [prevMode, setPrevMode] = useState<'text' | 'openapi' | null>(null);
  const [prevRequirements, setPrevRequirements] = useState<string | null>(null);
  const [prevSpec, setPrevSpec] = useState<string | null>(null);
  const [prevPreview, setPrevPreview] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [persistFileOnSave, setPersistFileOnSave] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  useEffect(() => {
    if (isOpen) {
      setFeature(initialData.feature || '');
      setStory(initialData.story || '');
      setOwner(initialData.owner || '');
      
      // Если есть подключение к FileUpload с контентом, блокируем режим выбора и подменяем содержимое
      if (actualHasFileUploadConnection && actualFileContent && prevMode === null) {
        // Сохраняем текущие значения, если они ещё не сохранены
        if (prevMode === null) setPrevMode(mode);
        if (prevRequirements === null) setPrevRequirements(requirementsText);
        if (prevSpec === null) setPrevSpec(specUrl);
        if (prevPreview === null) setPrevPreview(initialData.preview || initialData.requirements_text || initialData.requirements || null);

        // Only set mode to 'openapi' on initial connection (do not override user selection on rerenders)
        setMode('openapi');
        setRequirementsText('');
        setSpecUrl('');
        // Local preview should show file content if present, otherwise null
        setLocalPreview(actualFileContent || null);
      } else if (actualHasFileUploadConnection && actualFileContent) {
        // If file content becomes available after initial connection, update preview so user sees it immediately
        setLocalPreview(actualFileContent);
        // Ensure mode becomes 'openapi' when content is present (lock behavior follows showFileLocked)
        setMode('openapi');
      } else {
        // В случае отключения — восстанавливаем предыдущие значения, если есть
        if (prevMode !== null) {
          setMode(prevMode);
          setPrevMode(null);
        } else {
          setMode(initialData.mode || 'text');
        }

        if (prevRequirements !== null) {
          setRequirementsText(prevRequirements);
          setPrevRequirements(null);
        } else {
          setRequirementsText(initialData.requirements_text || '');
        }

        if (prevSpec !== null) {
          setSpecUrl(prevSpec);
          setPrevSpec(null);
        } else {
          setSpecUrl(initialData.openapi_url || initialData.specUrl || '');
        }
        if (prevPreview !== null) {
          setLocalPreview(prevPreview);
          setPrevPreview(null);
        } else {
          setLocalPreview(initialData.preview || initialData.requirements_text || initialData.requirements || '');
        }
      }
      
      setFormat(initialData.openapi_format || initialData.format || 'auto');
      setAuthType(initialData.auth_type || 'none');
      setAuthValue(initialData.auth_value || '');
      setKeyId(initialData.key_id || '');
      setKeySecret(initialData.key_secret || '');
    }
  }, [isOpen, initialData, actualHasFileUploadConnection, actualFileContent]);
  
  const handleSave = () => {
    // Do not block save on missing fields; validation is performed at Run time only.
    if (nodeId) {
      const saveData: ManualTestNodeData = {
        feature,
        story,
        owner,
        test_type: testType,
        createdAt: initialData.createdAt || new Date().toISOString()
      };
      
      // Если есть подключение к файлу (с содержимым) - по умолчанию НЕ сохраняем fileContent/preview в node,
      // это делается при запуске flow. Но если пользователь включил опцию 'Persist file on save', мы сохраняем.
      if (actualHasFileUploadConnection && actualFileContent) {
        Object.assign(saveData, {
          mode: 'openapi',
          requirements_text: '',
          openapi_url: '',
          openapi_format: format,
          fromFile: true,
          linkedFileName: actualFileName || ''
        });
        if (persistFileOnSave) {
          Object.assign(saveData, {
            fileContent: actualFileContent,
            preview: actualFileContent.slice(0, 500),
            requirements: actualFileContent
          });
        }
      } else if (actualHasFileUploadConnection && !actualFileContent) {
        // Connected to fileUpload, but no uploaded content yet — keep linked flag but do not persist fileContent or preview
        Object.assign(saveData, {
          mode: 'openapi',
          requirements_text: '',
          openapi_url: '',
          openapi_format: format,
          fromFile: true,
          linkedFileName: actualFileName || ''
        });
      } else {
        // Иначе используем обычные поля
        Object.assign(saveData, {
          mode,
          requirements_text: requirementsText,
          openapi_url: specUrl,
          openapi_format: format,
          auth_type: authType,
          auth_value: authValue,
          key_id: keyId,
          key_secret: keySecret,
          fromFile: false
        });
        // If we have previous or local preview content, persist it as preview on save for manual mode
        const effectivePreview = prevPreview || localPreview || (requirementsText ? requirementsText.slice(0, 500) : initialData.preview || '');
        if (effectivePreview) {
          (saveData as any).preview = (effectivePreview ?? '').slice(0, 500);
        }
      }
      
      onSave(nodeId, saveData);
      // clear prev states if saved (not strictly required but keeps memory clean)
      setPrevMode(null);
      setPrevRequirements(null);
      setPrevSpec(null);
      setPrevPreview(null);
      setLocalPreview(null);
      onClose();
    }
  };

  const validateLocal = () => {
    const errors: string[] = [];
    if (!feature?.trim()) errors.push('Feature is required');
    if (!story?.trim()) errors.push('Story is required');
    if (!owner?.trim()) errors.push('Owner is required');
    if (!showFileLocked) {
      if (mode === 'text' && !requirementsText?.trim()) errors.push('Text requirements are required for text mode');
      if (mode === 'openapi' && !specUrl?.trim() && !localPreview) errors.push('OpenAPI URL or uploaded file required for openapi mode');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };
  
  if (!isOpen || !nodeId) return null;
  
  const showFileLocked = actualHasFileUploadConnection && actualFileContent;
  // const previewText = initialData.preview || initialData.requirements_text || initialData.requirements || actualFileContent || '';

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Testing"
      titleColor="darkorange"
      maxWidth="800px"
    >
      <div className={styles.container}>
        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Feature:</label>
            <input
              type="text"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              className={styles.input}
              placeholder="Enter feature"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Story:</label>
            <input
              type="text"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              className={styles.input}
              placeholder="Enter story"
            />
          </div>
        </div>
        
        <div className={styles.gridContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Owner:</label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className={styles.input}
              placeholder="QA Team"
            />
          </div>
        </div>

        {showFileLocked && (
          <div className={styles.fileConnectionInfo}>
            <div className={styles.infoBox}>
              <div className={styles.infoIcon}>📄</div>
              <div className={styles.infoContent}>
                <h4 className={styles.infoTitle}>Requirements Source: File Upload</h4>
                <p className={styles.infoText}>
                  This manual test is connected to a file upload node. 
                  Requirements are automatically taken from the uploaded file.
                </p>
                <div className={styles.fileDetails}>
                  <strong>File:</strong> {actualFileName || 'Unnamed file'}
                </div>
                {localPreview && (
                  <div className={styles.filePreview}>
                    {localPreview.slice(0, 500)}
                    {(localPreview.length > 500) && '...'}
                  </div>
                )}
                <div className={styles.hint}>
                  <small>
                    To change requirements, disconnect from the file upload node or modify the uploaded file.
                    {localPreview && ' Preview is only persisted into the node when the flow is executed or when Persist file into node on Save is checked.'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showFileLocked && (
          <div className={styles.modeSwitch}>
            <label>
              <input
                type="radio"
                checked={mode === 'text'}
                onChange={() => setMode('text')}
              /> Text
            </label>
            <label>
              <input
                type="radio"
                checked={mode === 'openapi'}
                onChange={() => setMode('openapi')}
              /> OpenAPI
            </label>
          </div>
        )}

        {!showFileLocked && mode === 'text' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Текстовое описание (requirements):</label>
            <textarea
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              className={styles.textarea}
              placeholder='Например: "Протестировать калькулятор цен: добавление сервисов, расчет стоимости"'
            />
          </div>
        )}

        {!showFileLocked && mode === 'openapi' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>OpenAPI URL:</label>
              <input
                type="text"
                value={specUrl}
                onChange={(e) => setSpecUrl(e.target.value)}
                className={styles.input}
                placeholder="https://..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Format:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className={styles.select}
              >
                <option value="auto">auto</option>
                <option value="json">json</option>
                <option value="yaml">yaml</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Auth for URL:</label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as any)}
                className={styles.select}
              >
                <option value="none">No auth</option>
                <option value="bearer">Bearer token</option>
                <option value="header">Custom header</option>
              </select>
              {authType === 'bearer' && (
                <>
                  <input
                    type="text"
                    value={keyId}
                    onChange={(e) => setKeyId(e.target.value)}
                    className={styles.input}
                    placeholder="Key ID"
                  />
                  <input
                    type="password"
                    value={keySecret}
                    onChange={(e) => setKeySecret(e.target.value)}
                    className={styles.input}
                    placeholder="Key Secret"
                  />
                </>
              )}
              {authType === 'header' && (
                <input
                  type="text"
                  value={authValue}
                  onChange={(e) => setAuthValue(e.target.value)}
                  className={styles.input}
                  placeholder="Custom header value"
                />
              )}
              {authType === 'header' && (
                <div className={styles.hint}>Заголовок будет добавлен как X-API-Key: value</div>
              )}
            </div>
          </>
        )}
        
        {validationErrors.length > 0 && (
          <div className={styles.hint} style={{ color: 'red', marginBottom: 8 }}>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={persistFileOnSave} onChange={(e) => setPersistFileOnSave(e.target.checked)} />
            <span style={{ fontSize: 12 }}>Persist file into node on Save</span>
          </label>
          <button
            onClick={validateLocal}
            className={styles.generateButton}
          >
            Validate
          </button>
          <button
            onClick={handleSave}
            className={styles.saveButton}
          >
            Save
          </button>
        </div>
      </div>
    </ModalBase>
  );
};