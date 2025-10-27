/**
 * Datasets Client Service Layer
 *
 * This module provides client-side functions for interacting with the datasets API.
 * All functions are async and use fetch to call Next.js API routes.
 */

import type { Dataset } from '../types'

/**
 * Get all datasets for the authenticated user
 *
 * @returns Array of datasets
 * @throws Error if request fails
 */
export async function getAllDatasets(): Promise<Dataset[]> {
  const response = await fetch('/api/datasets')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch datasets')
  }

  return response.json()
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

  const response = await fetch(`/api/datasets/${id}?${params}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch dataset')
  }

  return response.json()
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

  const response = await fetch('/api/datasets', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create dataset')
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
  const response = await fetch(`/api/datasets/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete dataset')
  }
}
