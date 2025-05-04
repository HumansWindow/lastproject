import React from 'react';

export interface NavigationButtonProps {
  onClick: () => void;
  text: string;
  position: 'top' | 'bottom';
  className?: string;
  disabled?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  onClick,
  text,
  position,
  className = '',
  disabled = false,
}) => {
  const buttonClasses = [
    'ah-button',
    disabled ? 'disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={`ah-nav-button ${position}-nav-button`}>
      <button
        onClick={onClick}
        className={buttonClasses}
        aria-label={text}
        disabled={disabled}
      >
        {text}
      </button>
    </div>
  );
};

export default NavigationButton;