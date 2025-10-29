import React, { useState, useEffect, useRef } from 'react';

interface StoryFile {
  id: string;
  content: string;
  version: number;
  lastModified: Date;
}

interface Agent {
  id: string;
  name: string;
  title: string;
  description: string;
}

interface StoryEditorProps {
  storyFile: StoryFile;
  agents: Agent[];
  onSave: (content: string) => void;
  onAgentAction: (agentId: string, action: string, selectedText?: string) => void;
  onVersionHistory: () => void;
}

export const StoryEditor: React.FC<StoryEditorProps> = ({
  storyFile,
  agents,
  onSave,
  onAgentAction,
  onVersionHistory,
}) => {
  const [content, setContent] = useState(storyFile.content);
  const [selectedText, setSelectedText] = useState('');
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(storyFile.content);
  }, [storyFile.content]);

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      setSelectedText(selected);
      setShowAgentMenu(selected.length > 0);
    }
  };

  const handleAgentSelect = async (agentId: string) => {
    if (!selectedText.trim()) return;

    setIsLoading(true);
    try {
      await onAgentAction(agentId, 'improve', selectedText);
    } catch (error) {
      console.error('Agent action failed:', error);
    } finally {
      setIsLoading(false);
      setShowAgentMenu(false);
    }
  };

  const handleSave = () => {
    onSave(content);
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const charCount = content.length;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Story Editor</h2>
            <span className="text-sm text-gray-500">
              Version {storyFile.version} • {wordCount} words • {charCount} characters
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onVersionHistory}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              History
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-6">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={handleTextSelection}
            placeholder="Start writing your story..."
            className="w-full h-full resize-none border-0 bg-transparent text-gray-900 text-lg leading-relaxed focus:outline-none focus:ring-0"
            style={{ minHeight: '500px' }}
          />
        </div>
      </div>

      {/* Agent Panel */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Agent Menu */}
        {showAgentMenu && (
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Apply Agent to Selection</h3>
            <div className="space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200 hover:border-gray-300 disabled:opacity-50"
                >
                  <div className="font-medium">{agent.title}</div>
                  <div className="text-xs text-gray-500">{agent.description}</div>
                </button>
              ))}
            </div>
            {isLoading && (
              <div className="mt-3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Processing...</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => onAgentAction('plot-architect', 'generate-outline')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
            >
              Generate Plot Outline
            </button>
            <button
              onClick={() => onAgentAction('character-psychologist', 'analyze-characters')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
            >
              Analyze Characters
            </button>
            <button
              onClick={() => onAgentAction('editor', 'proofread')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
            >
              Proofread & Edit
            </button>
          </div>
        </div>

        {/* Writing Tips */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Writing Tips</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong className="text-gray-900">Show, Don't Tell:</strong> Instead of "She was angry," write "Her fists clenched, eyes flashing with rage."
            </div>
            <div>
              <strong className="text-gray-900">Active Voice:</strong> Use "The dog chased the cat" instead of "The cat was chased by the dog."
            </div>
            <div>
              <strong className="text-gray-900">Dialogue Tags:</strong> Mix "said," "asked," "replied" with action beats for variety.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};