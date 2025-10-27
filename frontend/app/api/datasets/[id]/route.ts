/**
 * Dataset API Routes - Single Dataset
 *
 * GET /api/datasets/:id - Get dataset with rows (paginated)
 * DELETE /api/datasets/:id - Delete a dataset
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataset, getDatasetRows, deleteDataset } from '@/lib/data/datasets'

/**
 * GET /api/datasets/:id
 * Get a single dataset with its rows (first 100 by default)
 *
 * Query params:
 * - limit: Number of rows to return (default: 100)
 * - offset: Number of rows to skip (default: 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get dataset metadata
    const dataset = await getDataset(params.id)

    // Get dataset rows
    const rows = await getDatasetRows(params.id, limit, offset)

    // Extract headers from first row if available
    const headers = rows.length > 0 && rows[0].data && typeof rows[0].data === 'object' && !Array.isArray(rows[0].data)
      ? Object.keys(rows[0].data)
      : []

    // Convert to UI format (matching existing Dataset interface)
    const response = {
      id: dataset.id,
      name: dataset.name,
      source: dataset.file_path ? ('upload' as const) : ('manual' as const),
      headers,
      row_count: dataset.row_count,
      rows: rows.map(r => r.data as Record<string, string>),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error(`[GET /api/datasets/${params.id}] Error:`, error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dataset' },
      { status: error.message.includes('not found') ? 404 : 500 }
    )
  }
}

/**
 * DELETE /api/datasets/:id
 * Delete a dataset (cascade deletes all rows)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteDataset(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`[DELETE /api/datasets/${params.id}] Error:`, error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete dataset' },
      { status: 500 }
    )
  }
}
