// Curated theme presets for variant generation
export const VARIANT_THEMES = [
  {
    id: 'camping',
    title: 'Camping Adventure',
    description: 'Under the stars with tents, campfire, and pine trees',
    prompt: 'camping in a cozy forest with tents, a campfire, pine trees, and stars in the night sky',
  },
  {
    id: 'amusement-park',
    title: 'Amusement Park',
    description: 'Roller coasters, ferris wheels, and cotton candy',
    prompt: 'visiting a magical amusement park with roller coasters, a ferris wheel, balloons, and colorful rides',
  },
  {
    id: 'beach',
    title: 'Beach Day',
    description: 'Sunny shores with sand castles and palm trees',
    prompt: 'enjoying a sunny beach with palm trees, sand castles, beach balls, and gentle waves',
  },
  {
    id: 'space',
    title: 'Space Explorer',
    description: 'Floating among stars, planets, and rockets',
    prompt: 'exploring outer space with rockets, planets, stars, and floating among the cosmos',
  },
  {
    id: 'underwater',
    title: 'Underwater World',
    description: 'Swimming with fish, coral, and sea creatures',
    prompt: 'diving in an underwater world with colorful fish, coral reefs, sea turtles, and bubbles',
  },
  {
    id: 'winter',
    title: 'Winter Wonderland',
    description: 'Snowflakes, snowmen, and cozy scarves',
    prompt: 'playing in a winter wonderland with snowflakes, snowmen, sleds, and cozy winter clothing',
  },
  {
    id: 'safari',
    title: 'Safari Adventure',
    description: 'Jungle animals, vines, and tropical plants',
    prompt: 'on a safari adventure with elephants, giraffes, lions, tropical trees, and safari vehicles',
  },
]

/**
 * Builds a custom prompt incorporating multiple theme contexts with a subject
 */
export function buildVariantPrompt(imageName: string, selectedThemeIds: string[], customPrompt?: string): string {
  const selectedThemes = VARIANT_THEMES.filter(t => selectedThemeIds.includes(t.id))
  
  if (customPrompt) {
    return `Create a black and white coloring book page featuring ${imageName}. ${customPrompt} The coloring page should have clear, bold outlines suitable for coloring, with a white background and black line art only. No shading, gradients, or filled areas - just clean outlines perfect for a child's coloring book.`
  }
  
  if (selectedThemes.length === 0) {
    return `Create a black and white coloring book page featuring ${imageName}. The coloring page should have clear, bold outlines suitable for coloring, with a white background and black line art only. No shading, gradients, or filled areas - just clean outlines perfect for a child's coloring book.`
  }
  
  const themeDescriptions = selectedThemes.map(t => t.prompt).join(', ')
  
  return `Create a black and white coloring book page featuring ${imageName} ${themeDescriptions}. The coloring page should have clear, bold outlines suitable for coloring, with a white background and black line art only. No shading, gradients, or filled areas - just clean outlines perfect for a child's coloring book.`
}

/**
 * Get the prompt string from a theme object
 */
export function getThemePrompt(theme: typeof VARIANT_THEMES[number]): string {
  return theme.prompt
}
