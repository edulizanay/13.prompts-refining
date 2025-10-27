/**
 * Authentication Middleware
 *
 * Verifies JWT tokens from the Authorization header and attaches user info to request.
 */

import { Request, Response, NextFunction } from 'express'
import { getSupabaseClientWithAuth } from './supabase'
import { User } from '@supabase/supabase-js'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
      supabase?: ReturnType<typeof getSupabaseClientWithAuth>
    }
  }
}

/**
 * Middleware to verify authentication and attach user to request
 *
 * Usage:
 * router.get('/protected', authMiddleware, (req, res) => {
 *   console.log(req.user) // User object available
 * })
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' })
      return
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with the user's token
    const supabase = getSupabaseClientWithAuth(token)

    // Verify the token and get user info
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Attach user and authenticated supabase client to request
    req.user = user
    req.supabase = supabase

    next()
  } catch (error) {
    console.error('[authMiddleware] Error:', error)
    res.status(500).json({ error: 'Internal server error during authentication' })
  }
}

/**
 * Optional middleware - allows requests to proceed without auth
 * but still attaches user info if token is present
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header, proceed without user
      next()
      return
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseClientWithAuth(token)

    const { data: { user }, error } = await supabase.auth.getUser()

    if (!error && user) {
      req.user = user
      req.supabase = supabase
    }

    next()
  } catch (error) {
    console.error('[optionalAuthMiddleware] Error:', error)
    // Don't block the request on auth errors
    next()
  }
}
