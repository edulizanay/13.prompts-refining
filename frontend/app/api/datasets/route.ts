/**
 * Dataset API Routes
 *
 * POST /api/datasets - Upload and create a new dataset
 * GET /api/datasets - List all datasets
 */

import { NextRequest, NextResponse } from 'next/server'
import { listDatasets, createDataset } from '@/lib/data/datasets'

/**
 * GET /api/datasets
 * List all datasets for the authenticated user
 */
export async function GET() {
  try {
    const datasets = await listDatasets()
    return NextResponse.json(datasets)
  } catch (error: any) {
    console.error('[GET /api/datasets] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch datasets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/datasets
 * Create a new dataset from uploaded CSV or JSON file
 *
 * Expects FormData with:
 * - file: CSV or JSON file
 * - name: Optional dataset name (defaults to filename)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const customName = formData.get('name') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const content = await file.text()
    const fileName = file.name
    const fileType = fileName.endsWith('.json') ? 'json' : 'csv'

    // Parse file based on type
    let rows: Record<string, any>[]
    let datasetName = customName || fileName.replace(/\.(csv|json)$/i, '')

    if (fileType === 'json') {
      try {
        const parsed = JSON.parse(content)
        rows = Array.isArray(parsed) ? parsed : [parsed]
      } catch (err) {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        )
      }
    } else {
      // Parse CSV
      rows = parseCSV(content)
      if (rows.length === 0) {
        return NextResponse.json(
          { error: 'CSV file is empty or invalid' },
          { status: 400 }
        )
      }
    }

    // Create dataset in Supabase
    // Note: We're not storing the actual file in Supabase Storage yet
    // That will be added in a future iteration if needed
    const dataset = await createDataset(datasetName, null, rows)

    return NextResponse.json(dataset, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/datasets] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create dataset' },
      { status: 500 }
    )
  }
}

/**
 * Parse CSV content into array of objects
 *
 * @param content - CSV file content as string
 * @returns Array of row objects
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // First line is headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // Parse remaining lines as data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parsing (doesn't handle quoted commas)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))

    if (values.length !== headers.length) {
      console.warn(`Row ${i} has ${values.length} values, expected ${headers.length}`)
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return rows
}
