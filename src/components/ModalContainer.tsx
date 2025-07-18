'use client'

import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'
import CashierModal from './CashierModal'
import SettingsModal from './SettingsModal'

// Create a simple event system for modal management
type ModalType = 'auth' | 'cashier' | 'settings' | null;

// Create a global event system for modals
const modalEvents = new EventTarget();
export const showModal = (type: ModalType) => {
  const event = new CustomEvent('showModal', { detail: type });
  modalEvents.dispatchEvent(event);
};

export default function ModalContainer() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    const handleShowModal = (event: Event) => {
      const customEvent = event as CustomEvent<ModalType>;
      setActiveModal(customEvent.detail);
    };

    modalEvents.addEventListener('showModal', handleShowModal);
    return () => modalEvents.removeEventListener('showModal', handleShowModal);
  }, []); // Empty dependency array since modalEvents is static

  const handleClose = () => {
    console.log('Closing modal:', activeModal)
    setActiveModal(null)
  }

  return (
    <>
      <AuthModal 
        isOpen={activeModal === 'auth'} 
        onClose={handleClose} 
      />
      <CashierModal 
        isOpen={activeModal === 'cashier'} 
        onClose={handleClose}
        onSuccess={handleClose}
      />
      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={handleClose}
      />
    </>
  );
} 