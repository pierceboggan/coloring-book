import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: 'org-xBug09vn6Yh8Uf19bKLjgxxu',
})

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

export async function generateColoringPage(imageUrl: string): Promise<string> {
  const defaultPrompt = "Create a black and white coloring book page based on this image. Transform it into simple, clean line art suitable for coloring with bold black outlines, no shading or fills, family-friendly content, and thick outlines perfect for coloring on a pure white background. Style: coloring book, line art, black and white only."
  return await generateColoringPageWithCustomPrompt(imageUrl, defaultPrompt)
}

export async function generateColoringPageWithCustomPrompt(imageUrl: string, customPrompt: string): Promise<string> {
  try {
    console.log('🎨 Starting coloring page generation for image:', imageUrl);
    console.log('📝 Using prompt:', customPrompt);
    
    // Convert the image URL to base64 for the Responses API
    console.log('📥 Converting image to base64...');
    const base64Image = await imageUrlToBase64(imageUrl);
    console.log('✅ Image converted to base64, length:', base64Image.length);
    
    // Use the Responses API with input image to generate coloring page
    console.log('🤖 Calling OpenAI Responses API...');
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { 
              type: "input_text", 
              text: customPrompt
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            },
          ],
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    console.log('📡 Received response from OpenAI');
    console.log('📊 Response output count:', response.output.length);
    console.log('📋 Response output types:', response.output.map(o => o.type));

    // Extract the generated image from the response
    const imageData = response.output
      .filter((output) => output.type === "image_generation_call")
      .map((output) => output.result);

    console.log('🖼️ Image generation calls found:', imageData.length);

    if (imageData.length > 0) {
      // Convert base64 to a data URL
      const imageBase64 = imageData[0];
      if (!imageBase64) {
        console.error('❌ Image data is null or empty');
        throw new Error('Generated image data is empty');
      }
      
      console.log('✅ Generated coloring page successfully, base64 length:', imageBase64.length);
      
      // Upload the generated image to Supabase storage
      console.log('📤 Processing and uploading coloring page to Supabase storage...');
      const { supabase } = await import('./supabase');
      const { addWatermark } = await import('./imageProcessor');
      
      // Convert base64 to buffer
      let buffer = Buffer.from(imageBase64, 'base64');
      
      // Add watermark (will be removed for higher tiers later)
      console.log('🏷️ Adding watermark to coloring page...');
      buffer = await addWatermark(buffer);
      
      const fileName = `coloring-page-${Date.now()}.png`;
      const filePath = `coloring-pages/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, buffer, {
          contentType: 'image/png'
        });
      
      if (uploadError) {
        console.error('❌ Failed to upload coloring page:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);
      
      console.log('✅ Coloring page uploaded successfully:', publicUrl);
      return publicUrl;
    }

    console.error('❌ No image data found in response');
    console.log('🔍 Full response output:', JSON.stringify(response.output, null, 2));
    throw new Error('No image generated in response')
  } catch (error) {
    console.error('💥 Error generating coloring page:', error);
    
    if (error instanceof Error) {
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    throw new Error('Failed to generate coloring page')
  }
}

export { openai }