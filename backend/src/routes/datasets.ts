/**
 * Datasets API Routes
 *
 * GET    /api/datasets     - List all datasets
 * POST   /api/datasets     - Upload and create a new dataset
 * GET    /api/datasets/:id - Get dataset with rows (paginated)
 * DELETE /api/datasets/:id - Delete a dataset
 */

import { Router, Request, Response } from 'express'
import multer from 'multer'
import { authMiddleware } from '../lib/auth'
import {
  listDatasets,
  createDataset,
  getDataset,
  getDatasetRows,
  deleteDataset,
} from '../data/datasets'

const router = Router()

// Configure multer for file uploads (memory storage)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// All routes require authentication
router.use(authMiddleware)

/**
 * GET /api/datasets
 * List all datasets for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const datasets = await listDatasets(req.supabase)
    res.json(datasets)
  } catch (error) {
    console.error('[GET /api/datasets] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch datasets',
    })
  }
})

/**
 * POST /api/datasets
 * Create a new dataset from uploaded CSV or JSON file
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' })
    }

    // Read file content
    const content = req.file.buffer.toString('utf-8')
    const fileName = req.file.originalname
    const fileType = fileName.endsWith('.json') ? 'json' : 'csv'
    const customName = req.body.name

    // Parse file based on type
    let rows: Record<string, any>[]
    let datasetName = customName || fileName.replace(/\.(csv|json)$/i, '')

    if (fileType === 'json') {
      try {
        const parsed = JSON.parse(content)
        rows = Array.isArray(parsed) ? parsed : [parsed]
      } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON format' })
      }
    } else {
      // Parse CSV
      rows = parseCSV(content)
      if (rows.length === 0) {
        return res.status(400).json({ error: 'CSV file is empty or invalid' })
      }
    }

    // Create dataset in Supabase
    const dataset = await createDataset(req.supabase, datasetName, null, rows)

    res.status(201).json(dataset)
  } catch (error) {
    console.error('[POST /api/datasets] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create dataset',
    })
  }
})

/**
 * GET /api/datasets/:id
 * Get a single dataset with its rows (first 100 by default)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const limit = parseInt(req.query.limit as string || '100', 10)
    const offset = parseInt(req.query.offset as string || '0', 10)

    // Get dataset metadata
    const dataset = await getDataset(req.supabase, req.params.id)

    // Get dataset rows
    const rows = await getDatasetRows(req.supabase, req.params.id, limit, offset)

    // Extract headers from first row if available
    const headers =
      rows.length > 0 &&
      rows[0].data &&
      typeof rows[0].data === 'object' &&
      !Array.isArray(rows[0].data)
        ? Object.keys(rows[0].data)
        : []

    // Convert to UI format (matching existing Dataset interface)
    const response = {
      id: dataset.id,
      name: dataset.name,
      source: dataset.file_path ? ('upload' as const) : ('manual' as const),
      headers,
      row_count: dataset.row_count,
      rows: rows.map((r) => r.data as Record<string, string>),
    }

    res.json(response)
  } catch (error) {
    console.error(`[GET /api/datasets/${req.params.id}] Error:`, error)
    const statusCode =
      error instanceof Error && error.message.includes('not found') ? 404 : 500
    res.status(statusCode).json({
      error: error instanceof Error ? error.message : 'Failed to fetch dataset',
    })
  }
})

/**
 * DELETE /api/datasets/:id
 * Delete a dataset (cascade deletes all rows)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    await deleteDataset(req.supabase, req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error(`[DELETE /api/datasets/${req.params.id}] Error:`, error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete dataset',
    })
  }
})

/**
 * Parse CSV content into array of objects
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  // First line is headers
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))

  // Parse remaining lines as data rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV parsing (doesn't handle quoted commas)
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))

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

export default router
