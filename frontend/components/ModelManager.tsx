// ABOUTME: Model column management - add/remove models for side-by-side comparison
// ABOUTME: Shows model selector dialog and renders column headers with remove buttons

'use client';

import { useState, useEffect } from 'react';
import { Model } from '@/lib/types';
import { getAllModels, createModel, deleteModel } from '@/lib/mockRepo.temp';

interface ModelManagerProps {
  selectedModelIds: string[];
  onModelsChange: (modelIds: string[]) => void;
}

// Mock model registry: temporary for Phase 1
const MODEL_REGISTRY = [
  { provider: 'OpenAI', model: 'gpt-4' },
  { provider: 'OpenAI', model: 'gpt-4-turbo' },
  { provider: 'Anthropic', model: 'claude-3-5-sonnet' },
  { provider: 'Anthropic', model: 'claude-3-opus' },
];

const MAX_MODELS = 4;

export function ModelManager({ selectedModelIds, onModelsChange }: ModelManagerProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  const [selectedModel, setSelectedModel] = useState('gpt-4');

  // Load models on mount
  useEffect(() => {
    const allModels = getAllModels();
    setModels(allModels);
    setMounted(true);
  }, []);

  // Sync selectedModelIds when models change
  useEffect(() => {
    if (mounted) {
      const validIds = selectedModelIds.filter((id) => models.some((m) => m.id === id));
      if (validIds.length !== selectedModelIds.length) {
        onModelsChange(validIds);
      }
    }
  }, [models, selectedModelIds, mounted, onModelsChange]);

  const handleAddModel = () => {
    if (selectedModelIds.length >= MAX_MODELS) {
      alert(`Maximum ${MAX_MODELS} models allowed`);
      return;
    }

    const newModel = createModel(selectedProvider, selectedModel);
    setModels(getAllModels());
    onModelsChange([...selectedModelIds, newModel.id]);
    setShowDialog(false);
  };

  const handleRemoveModel = (modelId: string) => {
    deleteModel(modelId);
    setModels(getAllModels());
    onModelsChange(selectedModelIds.filter((id) => id !== modelId));
  };

  if (!mounted) return null;

  const selectedModels = models.filter((m) => selectedModelIds.includes(m.id));
  const providers = Array.from(new Set(MODEL_REGISTRY.map((m) => m.provider)));
  const modelsForProvider = MODEL_REGISTRY.filter((m) => m.provider === selectedProvider);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Models</label>
        <button
          onClick={() => setShowDialog(true)}
          disabled={selectedModelIds.length >= MAX_MODELS}
          className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          + Add Model
        </button>
      </div>

      {/* Model columns display */}
      {selectedModels.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No models selected. Add one to begin.</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {selectedModels.map((model) => (
            <div
              key={model.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md border border-gray-300"
            >
              <span className="text-sm font-medium text-gray-700">
                {model.provider} / {model.model}
              </span>
              <button
                onClick={() => handleRemoveModel(model.id)}
                className="text-gray-500 hover:text-red-600 font-bold"
                title="Remove model"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add model dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Model</h3>

            <div className="space-y-4">
              {/* Provider selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    // Reset model to first of new provider
                    const first = MODEL_REGISTRY.find((m) => m.provider === e.target.value);
                    if (first) setSelectedModel(first.model);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  {modelsForProvider.map((m) => (
                    <option key={m.model} value={m.model}>
                      {m.model}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dialog buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModel}
                className="flex-1 px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
