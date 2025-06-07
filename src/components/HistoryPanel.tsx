import React, { useState } from 'react';
import { UndoRedoAction } from '../hooks/useUndoRedo';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: Array<UndoRedoAction<any> & { isCurrent: boolean; isAccessible: boolean }>;
  currentIndex: number;
  onJumpToAction: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  currentIndex,
  onJumpToAction,
  onUndo,
  onRedo,
  onClearHistory,
  canUndo,
  canRedo,
  undoDescription,
  redoDescription
}) => {
  const [filter, setFilter] = useState<'all' | 'effect' | 'parameter' | 'text' | 'timeline' | 'general'>('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter(action => 
    filter === 'all' || action.category === filter
  );

  const categoryIcons: { [key: string]: string } = {
    effect: '🎨',
    parameter: '⚙️',
    text: '📝',
    timeline: '⏱️',
    general: '📋'
  };

  const categoryColors: { [key: string]: string } = {
    effect: '#ff6b6b',
    parameter: '#4ecdc4',
    text: '#45b7d1',
    timeline: '#f39c12',
    general: '#95a5a6'
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const confirmClearHistory = () => {
    if (confirm('Clear all history? This action cannot be undone.')) {
      onClearHistory();
    }
  };

  return (
    <div className="history-overlay">
      <div className="history-panel">
        {/* Header */}
        <div className="history-header">
          <h3>History</h3>
          <div className="header-actions">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="action-button undo"
              title={undoDescription || 'Nothing to undo'}
            >
              ↶ Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="action-button redo"
              title={redoDescription || 'Nothing to redo'}
            >
              ↷ Redo
            </button>
            <button onClick={onClose} className="close-button">×</button>
          </div>
        </div>

        {/* Filter */}
        <div className="filter-section">
          <div className="filter-buttons">
            {['all', 'effect', 'parameter', 'text', 'timeline', 'general'].map(category => (
              <button
                key={category}
                onClick={() => setFilter(category as any)}
                className={`filter-button ${filter === category ? 'active' : ''}`}
              >
                {category === 'all' ? '🔍' : categoryIcons[category]} 
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="empty-history">
              <p>No history actions found</p>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="reset-filter">
                  Show all actions
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((action, index) => {
              const actualIndex = history.indexOf(action);
              return (
                <div
                  key={action.id}
                  className={`history-item ${action.isCurrent ? 'current' : ''} ${!action.isAccessible ? 'inaccessible' : ''}`}
                  onClick={() => action.isAccessible && onJumpToAction(actualIndex)}
                >
                  <div className="action-icon">
                    <span 
                      className="category-icon"
                      style={{ color: categoryColors[action.category] }}
                    >
                      {categoryIcons[action.category]}
                    </span>
                  </div>
                  
                  <div className="action-content">
                    <div className="action-description">
                      {action.description}
                    </div>
                    <div className="action-meta">
                      <span className="action-time">
                        {getRelativeTime(action.timestamp)}
                      </span>
                      <span className="action-category">
                        {action.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="action-indicators">
                    {action.isCurrent && (
                      <div className="current-indicator" title="Current state">
                        ●
                      </div>
                    )}
                    {!action.isAccessible && (
                      <div className="inaccessible-indicator" title="Cannot access - future state">
                        ⚪
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="history-footer">
          <div className="history-stats">
            <span>{history.length} total actions</span>
            <span>Position: {currentIndex + 1}/{history.length}</span>
          </div>
          
          <div className="footer-actions">
            <button 
              onClick={confirmClearHistory}
              className="clear-button"
              disabled={history.length <= 1}
            >
              Clear History
            </button>
          </div>
        </div>

        <style>{`
          .history-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .history-panel {
            background: #1a1a1a;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            height: 80%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }

          .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #333;
            background: #2a2a2a;
          }

          .history-header h3 {
            color: white;
            margin: 0;
            font-size: 20px;
          }

          .header-actions {
            display: flex;
            gap: 10px;
            align-items: center;
          }

          .action-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            color: white;
          }

          .action-button.undo {
            background: #f39c12;
          }

          .action-button.undo:hover:not(:disabled) {
            background: #e67e22;
          }

          .action-button.redo {
            background: #27ae60;
          }

          .action-button.redo:hover:not(:disabled) {
            background: #219a52;
          }

          .action-button:disabled {
            background: #666;
            cursor: not-allowed;
            opacity: 0.5;
          }

          .close-button {
            width: 32px;
            height: 32px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .filter-section {
            padding: 15px 20px;
            border-bottom: 1px solid #333;
            background: #2a2a2a;
          }

          .filter-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .filter-button {
            padding: 6px 12px;
            background: #333;
            color: #ccc;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .filter-button:hover {
            background: #444;
          }

          .filter-button.active {
            background: #4ecdc4;
            color: white;
          }

          .history-list {
            flex: 1;
            overflow-y: auto;
            padding: 0;
          }

          .empty-history {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #666;
            text-align: center;
          }

          .empty-history p {
            margin: 0 0 15px 0;
          }

          .reset-filter {
            padding: 8px 16px;
            background: #4ecdc4;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }

          .history-item {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            border-bottom: 1px solid #333;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
          }

          .history-item:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .history-item.current {
            background: rgba(78, 205, 196, 0.15);
            border-left: 4px solid #4ecdc4;
          }

          .history-item.inaccessible {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .history-item.inaccessible:hover {
            background: transparent;
          }

          .action-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            margin-right: 12px;
            flex-shrink: 0;
          }

          .category-icon {
            font-size: 16px;
          }

          .action-content {
            flex: 1;
            min-width: 0;
          }

          .action-description {
            color: white;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .action-meta {
            display: flex;
            gap: 12px;
            font-size: 11px;
            color: #888;
          }

          .action-time {
            white-space: nowrap;
          }

          .action-category {
            color: #666;
            text-transform: capitalize;
          }

          .action-indicators {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: 12px;
          }

          .current-indicator {
            color: #4ecdc4;
            font-size: 12px;
            font-weight: bold;
          }

          .inaccessible-indicator {
            color: #666;
            font-size: 12px;
          }

          .history-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-top: 1px solid #333;
            background: #2a2a2a;
          }

          .history-stats {
            display: flex;
            gap: 15px;
            font-size: 12px;
            color: #888;
          }

          .footer-actions {
            display: flex;
            gap: 10px;
          }

          .clear-button {
            padding: 6px 12px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
          }

          .clear-button:hover:not(:disabled) {
            background: #c0392b;
          }

          .clear-button:disabled {
            background: #666;
            cursor: not-allowed;
            opacity: 0.5;
          }

          /* Scrollbar styling */
          .history-list::-webkit-scrollbar {
            width: 6px;
          }

          .history-list::-webkit-scrollbar-track {
            background: #1a1a1a;
          }

          .history-list::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
          }

          .history-list::-webkit-scrollbar-thumb:hover {
            background: #555;
          }

          @media (max-width: 768px) {
            .history-panel {
              width: 95%;
              height: 90%;
            }

            .filter-buttons {
              justify-content: center;
            }

            .history-stats {
              flex-direction: column;
              gap: 4px;
            }

            .action-meta {
              flex-direction: column;
              gap: 2px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};