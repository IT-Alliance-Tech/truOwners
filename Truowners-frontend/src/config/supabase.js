import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPER_BASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPER_BASE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Updated upload function with better error handling
export const uploadFile = async (file, path) => {
  try {
    // First, try uploading with upsert: true to allow overwrites
    const { data, error } = await supabase.storage
      .from('idproofs-properties')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true // Allow overwriting existing files
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('idproofs-properties')
      .getPublicUrl(path)

    return {
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message || 'Upload failed'
    }
  }
}

// Helper function to generate unique filename
export const generateFileName = (originalName, userId) => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split('.').pop()
  return `${userId}_${timestamp}_${randomString}.${extension}`
}
