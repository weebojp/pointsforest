# Gacha System Fix - Deployment Instructions

## Issue Resolved
Fixed the "foreign key constraint violation" error in the gacha system that occurred when users tried to pull gacha but their profile didn't exist in the `users` table.

## Root Cause
The `execute_gacha_pull` RPC function was trying to insert items into `user_items` table with user IDs that didn't exist in the `users` table. This happened because:
1. The automatic user profile creation trigger might not be working correctly
2. Some users had auth accounts but no corresponding profiles in the `users` table

## Solution
Updated the `execute_gacha_pull` function to:
1. Check if user profile exists in `users` table
2. If not found, fetch user data from `auth.users` table
3. Automatically create the missing user profile
4. Continue with normal gacha execution
5. Added better error handling and logging

## Deployment Steps

### Option 1: Run SQL directly in Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `supabase/gacha-system-user-fix.sql`
3. Execute the query

### Option 2: Test locally first
1. Ensure the Next.js dev server is running
2. Visit the test page: http://localhost:3001/test-gacha
3. Test the "ガチャ実行関数" button with a real authenticated user
4. Verify it works without errors

## Expected Results
- Gacha pulls should work for all authenticated users
- Missing user profiles will be automatically created
- Better error messages for debugging
- Maintains all existing functionality

## Verification
1. Login to the application
2. Go to Gacha page (/gacha)
3. Try pulling from any gacha machine
4. Should work without foreign key constraint errors

## Files Modified
- `supabase/gacha-system-user-fix.sql` (new - contains the fix)
- `src/components/features/gacha/GachaDashboard.tsx` (improved error handling)

## Next Steps
After applying this fix:
1. Test gacha functionality with multiple users
2. Monitor for any remaining errors
3. Consider implementing additional user profile validation
4. Document this fix in the main project documentation