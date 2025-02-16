import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
}))

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Pencil: () => null
}))

// Add TextEncoder and TextDecoder polyfills
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add fetch and web API polyfills
const nodeFetch = require('node-fetch')
global.fetch = nodeFetch
global.Request = nodeFetch.Request
global.Response = nodeFetch.Response
global.Headers = nodeFetch.Headers
global.FormData = require('form-data')
global.Blob = require('node:buffer').Blob

// Mock window.URL.createObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = jest.fn()
  window.URL.revokeObjectURL = jest.fn()
} 