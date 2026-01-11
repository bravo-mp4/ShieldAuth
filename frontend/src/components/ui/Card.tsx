import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  onClick 
}) => {
  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-lg p-6 ${
        hover ? 'hover:border-primary-500 transition-all cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <h3 className={`text-xl font-semibold text-white ${className}`}>{children}</h3>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return <div className={className}>{children}</div>;
};
