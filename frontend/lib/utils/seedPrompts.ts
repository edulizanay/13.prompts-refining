/**
 * Seed Initial Prompts
 *
 * Creates default prompts in Supabase for testing.
 * Run this after signing in for the first time.
 */

import { createPrompt } from '../lib/services/prompts.client'

const seedPrompts = [
  {
    name: 'Helpful Assistant',
    type: 'generator' as const,
    text: 'You are a helpful assistant. The user asks: {{user_message}}\n\nRespond professionally and concisely.',
  },
  {
    name: 'Quality Grader',
    type: 'grader' as const,
    text: 'Rate the quality of this response: {{output}}\n\nRespond with either "Yes" or "No".',
  },
  {
    name: 'Creative Writer',
    type: 'generator' as const,
    text: 'Write a creative response to: {{prompt}}\n\nBe imaginative and engaging.',
  },
]

export async function seedInitialPrompts() {
  console.log('🌱 Seeding initial prompts...')

  const results = []
  for (const promptData of seedPrompts) {
    try {
      const prompt = await createPrompt(promptData.name, promptData.type, promptData.text)
      console.log(`✅ Created: ${prompt.name}`)
      results.push(prompt)
    } catch (error) {
      console.error(`❌ Failed to create ${promptData.name}:`, error)
    }
  }

  console.log(`\n🎉 Seeded ${results.length} prompts successfully!`)
  return results
}
