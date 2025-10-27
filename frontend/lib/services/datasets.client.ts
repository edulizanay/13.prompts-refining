/**
 * Datasets Client Service Layer
 *
 * This module provides client-side functions for interacting with the datasets API.
 * Calls the backend Express server on port 3001.
 */

import type { Dataset } from '../types'
import { apiRequest, apiFetch } from './api-client'

/**
 * Get all datasets for the authenticated user
 *
 * @returns Array of datasets
 * @throws Error if request fails
 */
export async function getAllDatasets(): Promise<Dataset[]> {
  return apiRequest<Dataset[]>('/api/datasets')
}

/**
 * Get a single dataset by ID with its rows
 *
 * @param id - The dataset UUID
 * @param limit - Maximum number of rows to return (default: 100)
 * @param offset - Number of rows to skip (default: 0)
 * @returns Dataset with rows
 * @throws Error if request fails
 */
export async function getDatasetById(
  id: string,
  limit: number = 100,
  offset: number = 0
): Promise<Dataset> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })

  return apiRequest<Dataset>(`/api/datasets/${id}?${params}`)
}

/**
 * Upload and create a new dataset from a file
 *
 * @param file - CSV or JSON file to upload
 * @param name - Optional custom name for the dataset
 * @returns The created dataset
 * @throws Error if upload or creation fails
 */
export async function createDataset(
  file: File,
  name?: string
): Promise<Dataset> {
  const formData = new FormData()
  formData.append('file', file)
  if (name) {
    formData.append('name', name)
  }

  const response = await apiFetch('/api/datasets', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    let errorMessage = 'Failed to create dataset'
    try {
      const error = await response.json()
      errorMessage = error.error || errorMessage
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Delete a dataset
 *
 * @param id - The dataset UUID
 * @throws Error if deletion fails
 */
export async function deleteDataset(id: string): Promise<void> {
  await apiRequest<{ success: boolean }>(`/api/datasets/${id}`, {
    method: 'DELETE',
  })
}
