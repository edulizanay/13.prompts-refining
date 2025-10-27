/**
 * GET /api/prompts/[id] - Get a single prompt
 * PATCH /api/prompts/[id] - Update a prompt
 * DELETE /api/prompts/[id] - Delete a prompt
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrompt, updatePrompt, deletePrompt } from '@/lib/data/prompts'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = await getPrompt(params.id)
    return NextResponse.json(prompt)
  } catch (error) {
    console.error('[API] GET /api/prompts/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch prompt' },
      { status: 404 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, type, text, expected_output, version_counter } = body

    // Build updates object
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (type !== undefined) {
      if (type !== 'generator' && type !== 'grader') {
        return NextResponse.json(
          { error: 'Invalid type. Must be "generator" or "grader"' },
          { status: 400 }
        )
      }
      updates.type = type
    }
    if (text !== undefined) updates.text = text
    if (expected_output !== undefined) updates.expected_output = expected_output
    if (version_counter !== undefined) updates.version_counter = version_counter

    const prompt = await updatePrompt(params.id, updates)
    return NextResponse.json(prompt)
  } catch (error) {
    console.error('[API] PATCH /api/prompts/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update prompt' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deletePrompt(params.id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[API] DELETE /api/prompts/[id] error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete prompt' },
      { status: 500 }
    )
  }
}
