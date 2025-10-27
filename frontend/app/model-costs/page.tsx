// ABOUTME: Model costs page - displays and allows editing of model pricing
// ABOUTME: Shows pricing per million tokens (input/output) for all models

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import type { Model } from '@/lib/types';
import { getAllModels, updateModel } from '@/lib/mockRepo.temp';

export default function ModelCosts() {
  const [models, setModels] = useState<Model[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price_input: string; price_output: string }>({
    price_input: '',
    price_output: ''
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = () => {
    const allModels = getAllModels();
    setModels(allModels);
  };

  const handleEdit = (model: Model) => {
    setEditingId(model.id);
    setEditValues({
      price_input: model.price_input.toString(),
      price_output: model.price_output.toString(),
    });
  };

  const handleSave = (id: string) => {
    const priceInput = parseFloat(editValues.price_input);
    const priceOutput = parseFloat(editValues.price_output);

    if (isNaN(priceInput) || isNaN(priceOutput)) {
      alert('Please enter valid numbers for pricing');
      return;
    }

    updateModel(id, {
      price_input: priceInput,
      price_output: priceOutput,
    });

    setEditingId(null);
    loadModels();
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ price_input: '', price_output: '' });
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeftIcon size={16} />
            Back to main
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">Model Costs</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Configure pricing per million tokens for each model
          </p>
        </div>

        {/* Table */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Input ($/1M tokens)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Output ($/1M tokens)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    {model.provider}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-neutral-700">
                    {model.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {editingId === model.id ? (
                      <input
                        type="number"
                        step="0.001"
                        value={editValues.price_input}
                        onChange={(e) => setEditValues({ ...editValues, price_input: e.target.value })}
                        className="w-24 px-2 py-1 text-right border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-neutral-900">${model.price_input.toFixed(3)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {editingId === model.id ? (
                      <input
                        type="number"
                        step="0.001"
                        value={editValues.price_output}
                        onChange={(e) => setEditValues({ ...editValues, price_output: e.target.value })}
                        className="w-24 px-2 py-1 text-right border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <span className="text-neutral-900">${model.price_output.toFixed(3)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {editingId === model.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleSave(model.id)}
                          className="px-3 py-1 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 text-xs font-medium bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(model)}
                        className="px-3 py-1 text-xs font-medium bg-purple-50 text-purple-500 border border-purple-200 rounded hover:bg-purple-100 hover:border-purple-500 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info */}
        <div className="mt-4 text-xs text-neutral-500">
          <p>Pricing is stored locally and used to calculate costs for each run.</p>
          <p className="mt-1">Cost calculation: (tokens_in × price_input + tokens_out × price_output) / 1,000,000</p>
        </div>
      </div>
    </div>
  );
}
