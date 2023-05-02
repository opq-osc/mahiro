import { isBase64 } from './base64'
import { test, expect } from 'vitest'

// https://github.com/miguelmota/is-base64/blob/master/example/example.js
const string =
  'iVBORw0KGgoAAAANSUhEUgAABQAAAALQAQMAAAD1s08VAAAAA1BMVEX/AAAZ4gk3AAAAh0lEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4GsTfAAGc95RKAAAAAElFTkSuQmCC'
const stringWithMime =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAALQAQMAAAD1s08VAAAAA1BMVEX/AAAZ4gk3AAAAh0lEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4GsTfAAGc95RKAAAAAElFTkSuQmCC'

test('isBase64', () => {
  expect(isBase64(string)).toBe(true)
  expect(isBase64(stringWithMime)).toBe(false)
  expect(isBase64('1342234')).toBe(false)
  expect(isBase64('afQ$%rfew')).toBe(false)
  expect(isBase64('dfasdfr342')).toBe(false)
  expect(isBase64('uuLMhh==')).toBe(true)
  expect(isBase64('uuLMhh')).toBe(false)
  expect(isBase64('')).toBe(false)
})
