/**
 * One-time seed script
 *
 * Run this in the browser console after signing in to create initial test prompts.
 *
 * Usage:
 * 1. Sign in to the app
 * 2. Open browser console (F12)
 * 3. Paste this script and press Enter
 */

(async function() {
  console.log('🚀 Starting seed script...')

  const seedPrompts = [
    {
      name: 'Helpful Assistant',
      type: 'generator',
      text: 'You are a helpful assistant. The user asks: {{user_message}}\n\nRespond professionally and concisely.',
    },
    {
      name: 'Quality Grader',
      type: 'grader',
      text: 'Rate the quality of this response: {{output}}\n\nRespond with either "Yes" or "No".',
    },
    {
      name: 'Creative Writer',
      type: 'generator',
      text: 'Write a creative response to: {{prompt}}\n\nBe imaginative and engaging.',
    },
  ]

  for (const promptData of seedPrompts) {
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptData),
      })

      if (response.ok) {
        const prompt = await response.json()
        console.log(`✅ Created: ${prompt.name}`)
      } else {
        const error = await response.json()
        console.error(`❌ Failed to create ${promptData.name}:`, error)
      }
    } catch (error) {
      console.error(`❌ Error creating ${promptData.name}:`, error)
    }
  }

  console.log('🎉 Seeding complete! Reload the page to see your prompts.')
  setTimeout(() => window.location.reload(), 1000)
})()
