'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  message: string | null;
  type: 'success' | 'error' | null;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, message, type, onClose }) => {
  if (!isOpen || !message) return null;

  const modalBgClass = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`p-6 rounded-lg shadow-lg text-white max-w-sm w-full mx-4 ${modalBgClass}`}>
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">{type === 'success' ? 'Éxito' : 'Error'}</h3>
          <button onClick={onClose} className="text-white text-2xl font-bold leading-none hover:text-gray-200">
            &times;
          </button>
        </div>
        <div className="mt-4">
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Modal;