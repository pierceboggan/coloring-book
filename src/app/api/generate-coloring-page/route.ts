import { NextRequest, NextResponse } from 'next/server'
import { generateColoringPage } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/generate-coloring-page",
    },
    async (span) => {
      console.log('🚀 API route /api/generate-coloring-page called');
      
      try {
    console.log('📥 Parsing request body...');
    const body = await request.json()
    console.log('✅ Request body parsed successfully:', body);
    
    const { imageId, imageUrl } = body
    
    span.setAttribute("imageId", imageId);
    span.setAttribute("hasImageUrl", !!imageUrl);

    if (!imageId || !imageUrl) {
      console.error('❌ Missing required fields:', { imageId, imageUrl })
      return NextResponse.json(
        { error: 'Missing imageId or imageUrl' },
        { status: 400 }
      )
    }

    console.log('🎨 About to call generateColoringPage with URL:', imageUrl);
    const coloringPageUrl = await generateColoringPage(imageUrl)
    console.log('✅ generateColoringPage completed, result:', coloringPageUrl?.substring(0, 50) + '...');
    
    if (!coloringPageUrl) {
      console.error('❌ generateColoringPage returned null/undefined');
      throw new Error('Failed to generate coloring page: No URL returned');
    }

    console.log('💾 Updating database with result...');
    console.log('🔍 Update data:', {
      imageId,
      coloringPageUrl: coloringPageUrl?.substring(0, 100) + '...',
      coloringPageUrlLength: coloringPageUrl?.length
    });
    
    // First, verify the record exists and get its current state
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()
    
    if (fetchError) {
      console.error('❌ Failed to fetch existing record:', fetchError);
      throw new Error(`Failed to fetch record: ${fetchError.message}`)
    }
    
    console.log('📋 Existing record before update:', {
      id: existingRecord.id,
      status: existingRecord.status,
      coloring_page_url: existingRecord.coloring_page_url,
      user_id: existingRecord.user_id
    });
    
    const updatePayload = {
      coloring_page_url: coloringPageUrl,
      status: 'completed' as const,
      updated_at: new Date().toISOString()
    }
    
    console.log('📤 Update payload:', updatePayload);
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('images')
      .update(updatePayload)
      .eq('id', imageId)
      .select()

    if (updateError) {
      console.error('❌ Database update failed:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`)
    }
    
    console.log('✅ Database updated successfully');
    console.log('📊 Updated record:', updateData);
    
    // Verify the update actually took effect
    const { data: verifyRecord, error: verifyError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()
    
    if (verifyError) {
      console.error('❌ Failed to verify update:', verifyError);
    } else {
      console.log('🔍 Record after update verification:', {
        id: verifyRecord.id,
        status: verifyRecord.status,
        coloring_page_url: verifyRecord.coloring_page_url?.substring(0, 100) + '...',
        updated_at: verifyRecord.updated_at
      });
      
      if (!verifyRecord.coloring_page_url) {
        console.error('🚨 CRITICAL: Update appeared successful but coloring_page_url is still NULL!');
      }
    }

    return NextResponse.json({
      success: true,
      coloringPageUrl
    })

  } catch (error) {
    console.error('💥 API Error caught:', error)
    Sentry.captureException(error)
    
    // Extract imageId from the original body if available
    let imageId
    try {
      if (body && body.imageId) {
        imageId = body.imageId
      }
    } catch (e) {
      console.error('❌ Could not extract imageId for error handling:', e)
    }
    
    if (imageId) {
      try {
        await supabaseAdmin
          .from('images')
          .update({
            status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('id', imageId)
      } catch (dbError) {
        console.error('Database error:', dbError)
      }
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate coloring page',
        success: false 
      },
      { status: 500 }
    )
  }
    }
  );
}