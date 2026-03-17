import { isPersistedUrl } from '@/lib/photo-storage'

describe('isPersistedUrl', () => {
  it('returns true for Supabase Storage URLs', () => {
    expect(isPersistedUrl('https://myproject.supabase.co/storage/v1/object/public/client-photos/clients/abc/photo.jpg'))
      .toBe(true)
  })

  it('returns false for Typeform URLs', () => {
    expect(isPersistedUrl('https://api.typeform.com/responses/12345/attachments/photo.jpg'))
      .toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isPersistedUrl('')).toBe(false)
  })

  it('returns false for arbitrary URLs', () => {
    expect(isPersistedUrl('https://example.com/photo.jpg')).toBe(false)
  })
})
