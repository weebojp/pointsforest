// デバッグ用：Supabase設定確認
export function checkSupabaseConfig() {
  console.log('=== Supabase Configuration Debug ===')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
  console.log('URL from env:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  // URLの形式確認
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url) {
    console.log('URL format check:', url.startsWith('https://') ? 'Valid' : 'Invalid')
    console.log('URL ends with .supabase.co:', url.endsWith('.supabase.co') ? 'Valid' : 'Invalid')
  }
  
  console.log('======================================')
}