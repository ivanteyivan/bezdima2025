import React from 'react';
import { Tab } from '../../types';
import styles from './styles.module.scss';

interface TabsBarProps {
  tabs: Tab[];
  activeTabId: string;
  isModalOpen: boolean;
  onSwitchTab: (tabId: string) => void;
  onDeleteTab: (tabId: string) => void;
  onAddTab: () => void;
}

export const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeTabId,
  isModalOpen,
  onSwitchTab,
  onDeleteTab,
  onAddTab,
}) => {
  return (
    <div className={`${styles.tabsBar} ${styles.tabsScrollbar}`}>
      {tabs.map((tab) => {
        const tabNodes = tab.nodes;
        const tabHasStartNode = tabNodes.some(node => node.type === 'start');
        const tabHasEndNode = tabNodes.some(node => node.type === 'end');
        
        const tabClass = `${styles.tab} ${
          activeTabId === tab.id ? styles.tabActive : ''
        } ${isModalOpen ? styles.tabDisabled : ''}`;
        
        const tabLabelClass = `${styles.tabLabel} ${
          activeTabId === tab.id ? styles.tabLabelActive : ''
        }`;
        
        const tabCounterClass = `${styles.tabCounter} ${
          activeTabId === tab.id ? styles.tabCounterActive : ''
        }`;
        
        const deleteButtonClass = `${styles.tabDeleteBtn} ${
          isModalOpen ? styles.tabDeleteBtnDisabled : ''
        }`;
        
        return (
          <div
            key={tab.id}
            className={tabClass}
            onClick={() => !isModalOpen && onSwitchTab(tab.id)}
            title={`${tab.label}: ${tab.nodes.length} nodes, ${tab.edges.length} edges`}
          >
            <div className={tabLabelClass}>
              <span className={styles.tabLabelText}>{tab.label}</span>
              <div className={styles.tabIndicators}>
                {tabHasStartNode && (
                  <span 
                    className={`${styles.tabIndicator} ${styles.tabIndicatorStart}`}
                    title="Has START node" 
                  />
                )}
                {tabHasEndNode && (
                  <span 
                    className={`${styles.tabIndicator} ${styles.tabIndicatorEnd}`}
                    title="Has END node" 
                  />
                )}
              </div>
            </div>
            
            <div className={styles.tabRightSection}>
              <div className={tabCounterClass}>
                {tab.nodes.length}
              </div>
              
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isModalOpen) onDeleteTab(tab.id);
                  }}
                  disabled={isModalOpen}
                  className={deleteButtonClass}
                  title={isModalOpen ? 'Cannot delete tab while modal is open' : `Delete tab "${tab.label}"`}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      <button
        onClick={() => onAddTab()}
        disabled={tabs.length >= 10 || isModalOpen}
        className={`${styles.addTabBtn} ${
          (tabs.length >= 10 || isModalOpen) ? styles.addTabBtnDisabled : ''
        }`}
        title={isModalOpen ? 'Cannot add tab while modal is open' : (tabs.length >= 10 ? 'Maximum 10 tabs' : 'Add new tab')}
      >
        +
      </button>
      
      <div className={styles.tabsCounter}>
        {tabs.length}/10
      </div>
    </div>
  );
};