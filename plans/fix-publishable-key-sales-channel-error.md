# Fixing "Publishable key needs to have a sales channel configured" Error

## Overview

This document provides a comprehensive guide to resolving the error:
```
Error: Publishable key needs to have a sales channel configured
```

This error occurs when your Medusa storefront attempts to fetch products using a publishable API key that hasn't been associated with any sales channels.

---

## What This Error Means

In Medusa, **publishable API keys** are used to authenticate storefront requests to the backend. For security and multi-channel support, each publishable key must be explicitly associated with one or more **sales channels**.

A sales channel represents a specific selling context (e.g., web storefront, mobile app, marketplace). Products are assigned to sales channels, and publishable keys control which products are accessible through which channels.

**The error occurs because:**
- Your publishable key `pk_b6bc16dc73474bbbb326f46e7987986a909db36c07b1e3010f45d1a25cf6c1cc` exists
- The Medusa backend can authenticate requests with this key
- However, the key is not linked to any sales channel
- Without a sales channel association, the API cannot determine which products to return

---

## Why This Happens

Common scenarios that cause this error:

1. **New Medusa Installation**: Fresh installations may create publishable keys without automatically associating them with sales channels
2. **Key Regeneration**: If you regenerated or created a new publishable key, it won't inherit sales channel associations
3. **Sales Channel Deletion**: The sales channel previously associated with the key was deleted
4. **Manual Configuration Required**: Some Medusa versions require manual sales channel configuration for publishable keys
5. **Database Migration Issues**: Database migrations or resets may have cleared sales channel associations

---

## How to Fix It in Medusa Admin

Follow these step-by-step instructions to associate your publishable key with a sales channel:

### Step 1: Log into Medusa Admin

1. Navigate to your Medusa Admin dashboard: **https://admin.techsouk.com**
2. Log in with your admin credentials

### Step 2: Navigate to API Key Management

Depending on your Medusa version, the location may vary:

**Option A: Settings → Publishable API Keys**
1. Click on **Settings** in the left sidebar
2. Look for **Publishable API Keys** or **API Key Management**
3. Click to open the API key management page

**Option B: Settings → Developers → API Key Management**
1. Click on **Settings** in the left sidebar
2. Navigate to **Developers** section
3. Click on **API Key Management** or **Publishable API Keys**

### Step 3: Find Your Publishable Key

1. Look for the publishable key that starts with: `pk_b6bc16dc73474bbbb326f46e7987986a909db36c07b1e3010f45d1a25cf6c1cc`
2. You should see a list of all publishable keys with their associated sales channels
3. If your key shows **no sales channels** or **0 sales channels**, this confirms the issue

### Step 4: Associate the Key with Sales Channels

1. Click on the publishable key or click the **Edit** button next to it
2. You should see a section for **Sales Channels** or **Associated Sales Channels**
3. Click **Add Sales Channel** or select from available sales channels
4. Select at least one sales channel (typically "Default Sales Channel" or your main storefront channel)
5. Click **Save** or **Update** to apply the changes

### Step 5: Verify Sales Channel Has Products

Ensure the sales channel you selected actually has products assigned:

1. Navigate to **Settings → Sales Channels** (or **Products → Sales Channels**)
2. Click on the sales channel you just associated with your publishable key
3. Verify that products are assigned to this channel
4. If no products are assigned:
   - Go to **Products** in the main menu
   - Select products you want to make available
   - Edit each product and ensure the sales channel is checked/selected
   - Save the changes

---

## Alternative Solution: Create a New Publishable Key

If you prefer to start fresh or cannot modify the existing key:

### Step 1: Create a New Publishable Key

1. Log into Medusa Admin at **https://admin.techsouk.com**
2. Navigate to **Settings → Publishable API Keys**
3. Click **Create Publishable API Key** or **Add New Key**
4. Give it a descriptive name (e.g., "Storefront Key - 2026")

### Step 2: Associate with Sales Channel During Creation

1. In the creation form, look for **Sales Channels** section
2. Select one or more sales channels (at minimum, select your default/main sales channel)
3. Click **Create** or **Save**

### Step 3: Copy the New Key

1. Copy the newly generated publishable key (starts with `pk_`)
2. **Important**: Save this key securely as it may not be shown again

### Step 4: Update Your Environment Variables

1. Open your Next.js project
2. Edit the `.env.local` file
3. Update the `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` variable:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_new_key_here
```

4. Save the file
5. Restart your Next.js development server:

```bash
yarn dev
```

---

## Verification Steps

After applying the fix, verify that everything works:

### 1. Check in Medusa Admin

1. Go to **Settings → Publishable API Keys**
2. Confirm your key now shows **1 or more sales channels** associated
3. Click on the key to view details and verify the correct sales channel is linked

### 2. Test the Storefront

1. Restart your Next.js application if it's running
2. Navigate to your storefront (e.g., http://localhost:8000 or your production URL)
3. Try to access the store page or product listings
4. The error should no longer appear, and products should load successfully

### 3. Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Refresh the page
4. Verify there are no errors related to publishable keys or sales channels

### 4. Test API Directly (Optional)

You can test the API directly using curl or a tool like Postman:

```bash
curl -X GET "https://admin.techsouk.com/store/products" \
  -H "x-publishable-api-key: pk_b6bc16dc73474bbbb326f46e7987986a909db36c07b1e3010f45d1a25cf6c1cc"
```

A successful response should return a list of products without errors.

---

## Additional Notes

### About Sales Channels

- **Sales channels** are a core concept in Medusa for multi-channel commerce
- They allow you to:
  - Sell different products on different platforms (web, mobile, marketplace)
  - Have different pricing or availability per channel
  - Manage inventory separately for each channel
  - Control which products are visible where

### Default Sales Channel

- Most Medusa installations create a "Default Sales Channel" automatically
- If you only have one storefront, associating your publishable key with the default channel is usually sufficient
- You can rename this channel to something more descriptive (e.g., "Web Storefront")

### Multiple Sales Channels

- You can associate a single publishable key with multiple sales channels
- This is useful if you want one storefront to display products from multiple channels
- Products will be aggregated from all associated channels

### Product Visibility

- A product must be:
  1. **Published** (status = published)
  2. **Assigned to a sales channel**
  3. That sales channel must be **associated with your publishable key**
- If products still don't appear after fixing the key, check these three conditions

### Environment Variables

Your Next.js storefront uses these environment variables (configured in [`src/lib/config.ts`](src/lib/config.ts:14-18)):

```typescript
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://admin.techsouk.com
```

Always restart your development server after changing environment variables.

---

## Troubleshooting

### Issue: "I don't see API Key Management in Settings"

**Solution**: Your Medusa version might use a different navigation structure. Try:
- Looking under **Settings → Developers**
- Searching for "publishable" in the admin search bar
- Checking **Settings → Advanced** or **Settings → Store Details**

### Issue: "No sales channels are available to select"

**Solution**: You need to create a sales channel first:
1. Go to **Settings → Sales Channels**
2. Click **Create Sales Channel**
3. Name it (e.g., "Web Storefront")
4. Save it
5. Then return to API Key Management and associate it with your publishable key

### Issue: "Products still don't appear after fixing the key"

**Solution**: Check the following:
1. Verify products are published (not draft)
2. Verify products are assigned to the sales channel
3. Clear your browser cache and restart the Next.js server
4. Check the region configuration - products must be available in the region you're browsing

### Issue: "Error persists after following all steps"

**Solution**: 
1. Double-check the publishable key in your `.env.local` matches the one in Medusa Admin
2. Ensure there are no typos or extra spaces in the environment variable
3. Verify the backend URL is correct: `https://admin.techsouk.com`
4. Check Medusa backend logs for additional error details
5. Try creating a completely new publishable key and updating your environment variables

---

## Summary

The "Publishable key needs to have a sales channel configured" error is resolved by:

1. ✅ Logging into Medusa Admin at https://admin.techsouk.com
2. ✅ Navigating to Settings → Publishable API Keys
3. ✅ Finding your publishable key (`pk_b6bc16dc73474bbbb326f46e7987986a909db36c07b1e3010f45d1a25cf6c1cc`)
4. ✅ Associating it with at least one sales channel
5. ✅ Ensuring that sales channel has products assigned to it
6. ✅ Restarting your Next.js application
7. ✅ Verifying products now load successfully

This is a configuration issue, not a code issue, and should be resolved entirely through the Medusa Admin interface.
