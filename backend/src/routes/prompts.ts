/**
 * Prompts API Routes
 *
 * GET    /api/prompts      - List all prompts
 * POST   /api/prompts      - Create a new prompt
 * GET    /api/prompts/:id  - Get a single prompt
 * PATCH  /api/prompts/:id  - Update a prompt
 * DELETE /api/prompts/:id  - Delete a prompt
 */

import { Router, Request, Response } from 'express'
import { authMiddleware } from '../lib/auth'
import {
  listPrompts,
  listPromptsByType,
  createPrompt,
  getPrompt,
  updatePrompt,
  deletePrompt,
} from '../data/prompts'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

/**
 * GET /api/prompts
 * List all prompts (with optional type filter)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as 'generator' | 'grader' | undefined

    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const prompts = type
      ? await listPromptsByType(req.supabase, type)
      : await listPrompts(req.supabase)

    res.json(prompts)
  } catch (error) {
    console.error('[GET /api/prompts] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch prompts',
    })
  }
})

/**
 * POST /api/prompts
 * Create a new prompt
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, text } = req.body

    if (!name || !type) {
      return res.status(400).json({ error: 'Missing required fields: name, type' })
    }

    if (type !== 'generator' && type !== 'grader') {
      return res.status(400).json({ error: 'Invalid type. Must be "generator" or "grader"' })
    }

    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const prompt = await createPrompt(req.supabase, {
      name,
      type,
      text: text || '',
    })

    res.status(201).json(prompt)
  } catch (error) {
    console.error('[POST /api/prompts] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create prompt',
    })
  }
})

/**
 * GET /api/prompts/:id
 * Get a single prompt by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const prompt = await getPrompt(req.supabase, req.params.id)
    res.json(prompt)
  } catch (error) {
    console.error('[GET /api/prompts/:id] Error:', error)
    res.status(404).json({
      error: error instanceof Error ? error.message : 'Failed to fetch prompt',
    })
  }
})

/**
 * PATCH /api/prompts/:id
 * Update a prompt
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, type, text, expected_output, version_counter } = req.body

    // Build updates object
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) {
      if (type !== 'generator' && type !== 'grader') {
        return res.status(400).json({ error: 'Invalid type. Must be "generator" or "grader"' })
      }
      updates.type = type
    }
    if (text !== undefined) updates.text = text
    if (expected_output !== undefined) updates.expected_output = expected_output
    if (version_counter !== undefined) updates.version_counter = version_counter

    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const prompt = await updatePrompt(req.supabase, req.params.id, updates)
    res.json(prompt)
  } catch (error) {
    console.error('[PATCH /api/prompts/:id] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update prompt',
    })
  }
})

/**
 * DELETE /api/prompts/:id
 * Delete a prompt
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.supabase) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    await deletePrompt(req.supabase, req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/prompts/:id] Error:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete prompt',
    })
  }
})

export default router
