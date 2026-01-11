import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  isValid?: boolean;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  isValid,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full px-4 py-2 ${icon ? 'pl-10' : ''} bg-gray-800 border ${
            error ? 'border-error' : isValid ? 'border-success' : 'border-gray-700'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${className}`}
          {...props}
        />
        {isValid && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
            <CheckCircle2 size={18} />
          </div>
        )}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error">
            <AlertCircle size={18} />
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-error flex items-center gap-1 mt-1">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-400">{helpText}</p>
      )}
    </div>
  );
};
