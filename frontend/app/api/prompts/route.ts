/**
 * GET /api/prompts - List all prompts
 * POST /api/prompts - Create a new prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  listPrompts,
  createPrompt,
  listPromptsByType,
} from '@/lib/data/prompts'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as 'generator' | 'grader' | null

    const prompts = type ? await listPromptsByType(type) : await listPrompts()

    return NextResponse.json(prompts)
  } catch (error) {
    console.error('[API] GET /api/prompts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, text } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      )
    }

    if (type !== 'generator' && type !== 'grader') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "generator" or "grader"' },
        { status: 400 }
      )
    }

    const prompt = await createPrompt({
      name,
      type,
      text: text || '',
    })

    return NextResponse.json(prompt, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/prompts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create prompt' },
      { status: 500 }
    )
  }
}
