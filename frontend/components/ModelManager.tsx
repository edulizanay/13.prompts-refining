// ABOUTME: Model column management - add/remove models for side-by-side comparison
// ABOUTME: Shows model selector dialog and renders column headers with remove buttons

'use client';

import { useState, useEffect } from 'react';
import { Model } from '@/lib/types';
import { getAllModels, createModel, deleteModel } from '@/lib/mockRepo.temp';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ModelManagerProps {
  selectedModelIds: string[];
  onModelsChange: (modelIds: string[]) => void;
}

// Model registry built from available seed models
// Used to populate the provider/model dropdowns in the add model dialog

const MAX_MODELS = 4;

export function ModelManager({ selectedModelIds, onModelsChange }: ModelManagerProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // Load models on mount and initialize with default model if none selected
  useEffect(() => {
    const allModels = getAllModels();
    setModels(allModels);

    // Build registry from available models
    if (allModels.length > 0) {
      const firstProvider = allModels[0].provider;
      setSelectedProvider(firstProvider);

      const firstModel = allModels.find(m => m.provider === firstProvider);
      if (firstModel) {
        setSelectedModel(firstModel.model);
      }

      // Initialize with first model if none selected
      if (selectedModelIds.length === 0) {
        const firstModelId = allModels[0].id;
        onModelsChange([firstModelId]);
      }
    }

    setMounted(true);
  }, []);

  // Handle Esc key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDialog) {
        setShowDialog(false);
      }
    };

    if (showDialog) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showDialog]);

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
  const providers = Array.from(new Set(models.map((m) => m.provider)));
  const modelsForProvider = models.filter((m) => m.provider === selectedProvider);

  return (
    <div>
      {/* Model cards - horizontal stack with fixed width */}
      <div className="flex items-center gap-2">
        {selectedModels.map((model) => (
          <div
            key={model.id}
            className="group relative w-40 p-2 bg-white rounded-md border border-gray-200 hover:border-primary hover:shadow-sm transition-all cursor-pointer flex items-center justify-between"
            onClick={() => setShowDialog(true)}
            title="Click to change model"
          >
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 truncate">{model.provider}</p>
              <p className="text-xs text-gray-500 truncate">{model.model}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveModel(model.id);
              }}
              className="flex-shrink-0 ml-2 text-gray-400 group-hover:text-gray-400 font-bold transition-colors opacity-0 group-hover:opacity-100"
              title="Remove model"
            >
              ✕
            </button>
          </div>
        ))}

        {/* Plus button - with modest margin from cards */}
        <button
          onClick={() => setShowDialog(true)}
          disabled={selectedModelIds.length >= MAX_MODELS}
          className="ml-4 text-2xl text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Add model"
        >
          +
        </button>
      </div>

      {/* Add model dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Model</h3>

            <div className="space-y-4">
              {/* Provider selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-left bg-white hover:bg-gray-50">
                      {selectedProvider}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {providers.map((p) => (
                      <DropdownMenuItem
                        key={p}
                        onClick={() => {
                          setSelectedProvider(p);
                          // Reset model to first of new provider
                          const first = models.find((m) => m.provider === p);
                          if (first) setSelectedModel(first.model);
                        }}
                      >
                        {p}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Model selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-left bg-white hover:bg-gray-50">
                      {selectedModel}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    {modelsForProvider.map((m) => (
                      <DropdownMenuItem key={m.model} onClick={() => setSelectedModel(m.model)}>
                        {m.model}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Dialog buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddModel}
                className="w-full px-3 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Press <kbd className="bg-gray-100 px-1 rounded text-xs">Esc</kbd> to cancel</p>
          </div>
        </div>
      )}
    </div>
  );
}
