// Shared utility for resolving storage image URLs
import { BASE_URL } from '@/services/api'

/**
 * Resolves a storage file path to a full URL.
 * Handles: null/undefined, full HTTP URLs, and relative storage paths.
 * 
 * @param {string|null} path - The file path (e.g., "foto_barang/abc.jpg" or "http://...")
 * @param {string|null} fallback - Fallback URL if path is empty (default: null)
 * @returns {string|null} Full URL to the file, or fallback
 */
export function getStorageUrl(path, fallback = null) {
  if (!path) return fallback
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // Remove leading slash if present to avoid double slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${BASE_URL}/storage/${cleanPath}`
}
