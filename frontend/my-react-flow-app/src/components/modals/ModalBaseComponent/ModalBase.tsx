import React, { ReactNode } from 'react';
import styles from './styles.module.scss';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  titleColor?: string;
}

export const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '800px',
  titleColor = 'darkslategray',
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div 
        className={`${styles.modalContent} modal-scrollbar`}
        style={{ maxWidth }}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ color: titleColor }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};