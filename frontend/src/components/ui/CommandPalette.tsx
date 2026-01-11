import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, File, Settings, Users, Key, Book, BarChart } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const commands: Command[] = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: <BarChart size={16} />,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'dashboard', 'overview']
    },
    {
      id: 'applications',
      label: 'View Applications',
      icon: <File size={16} />,
      action: () => navigate('/applications'),
      keywords: ['apps', 'applications', 'projects']
    },
    {
      id: 'users',
      label: 'Manage Users',
      icon: <Users size={16} />,
      action: () => navigate('/users'),
      keywords: ['users', 'accounts', 'people']
    },
    {
      id: 'licenses',
      label: 'View Licenses',
      icon: <Key size={16} />,
      action: () => navigate('/licenses'),
      keywords: ['licenses', 'keys', 'activation']
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      icon: <Key size={16} />,
      action: () => navigate('/api-keys'),
      keywords: ['api', 'keys', 'tokens', 'authentication']
    },
    {
      id: 'docs',
      label: 'Documentation',
      icon: <Book size={16} />,
      action: () => navigate('/documentation'),
      keywords: ['docs', 'documentation', 'help', 'guide']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
      action: () => navigate('/settings'),
      keywords: ['settings', 'preferences', 'config']
    }
  ];

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.includes(searchLower))
    );
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommand = (action: () => void) => {
    action();
    setIsOpen(false);
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search commands..."
              className="flex-1 bg-transparent text-white outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs bg-gray-700 rounded">ESC</kbd>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                No commands found
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={() => handleCommand(cmd.action)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-gray-400">{cmd.icon}</span>
                  <span className="flex-1 text-white">{cmd.label}</span>
                </button>
              ))
            )}
          </div>
          <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-400 flex items-center justify-between">
            <span>Use ↑ ↓ to navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">K</kbd> to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
};
