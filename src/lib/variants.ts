// Curated theme packs and metadata for variant generation
export type VariantPackType = 'core' | 'seasonal' | 'community'

export interface VariantThemeDefinition {
  id: string
  title: string
  description: string
  prompt: string
  thumbnail: string
  tags?: string[]
  submittedBy?: string
}

export interface VariantPack {
  id: string
  title: string
  description: string
  category: string
  type: VariantPackType
  thumbnail: string
  seasonal?: boolean
  availabilityNote?: string
  themes: VariantThemeDefinition[]
}

export interface VariantTheme extends VariantThemeDefinition {
  packId: string
  packTitle: string
  packType: VariantPackType
  packCategory: string
  seasonal: boolean
}

export const VARIANT_PACKS: VariantPack[] = [
  {
    id: 'outdoor-adventures',
    title: 'Outdoor Adventures',
    description: 'Trail-ready prompts for explorers, campers, and nature lovers.',
    category: 'Adventure',
    type: 'core',
    thumbnail: '/variant-thumbnails/pack-outdoor.svg',
    themes: [
      {
        id: 'camping',
        title: 'Camping Adventure',
        description: 'Under the stars with tents, campfire, and pine trees',
        prompt:
          'camping in a cozy forest with tents, a campfire, pine trees, and stars in the night sky',
        thumbnail: '/variant-thumbnails/camping.svg',
        tags: ['Night sky', 'Campfire'],
      },
      {
        id: 'safari',
        title: 'Safari Adventure',
        description: 'Jungle animals, vines, and tropical plants',
        prompt:
          'on a safari adventure with elephants, giraffes, lions, tropical trees, and safari vehicles',
        thumbnail: '/variant-thumbnails/safari.svg',
        tags: ['Wildlife', 'Explorer'],
      },
      {
        id: 'mountain-expedition',
        title: 'Mountain Expedition',
        description: 'Rope bridges, alpine peaks, and friendly mountain goats',
        prompt:
          'scaling misty mountains with rope bridges, backpacks, alpine pine trees, and friendly mountain goats',
        thumbnail: '/variant-thumbnails/mountain-expedition.svg',
        tags: ['Alpine', 'Challenge'],
      },
    ],
  },
  {
    id: 'imagination-station',
    title: 'Whimsy Workshop',
    description: 'Fantastical destinations that bend physics and sparkle with surprise.',
    category: 'Imagination',
    type: 'core',
    thumbnail: '/variant-thumbnails/pack-whimsy.svg',
    themes: [
      {
        id: 'amusement-park',
        title: 'Amusement Park',
        description: 'Roller coasters, ferris wheels, and cotton candy',
        prompt:
          'visiting a magical amusement park with roller coasters, a ferris wheel, balloons, and colorful rides',
        thumbnail: '/variant-thumbnails/amusement-park.svg',
        tags: ['Rides', 'Carnival'],
      },
      {
        id: 'space',
        title: 'Space Explorer',
        description: 'Floating among stars, planets, and rockets',
        prompt:
          'exploring outer space with rockets, planets, stars, and floating among the cosmos',
        thumbnail: '/variant-thumbnails/space.svg',
        tags: ['Sci-fi', 'Stars'],
      },
      {
        id: 'underwater',
        title: 'Underwater World',
        description: 'Swimming with fish, coral, and sea creatures',
        prompt:
          'diving in an underwater world with colorful fish, coral reefs, sea turtles, and bubbles',
        thumbnail: '/variant-thumbnails/underwater.svg',
        tags: ['Ocean', 'Creatures'],
      },
      {
        id: 'skyport-carousels',
        title: 'Skyport Carousels',
        description: 'Floating airships, ribbons of clouds, and musical kites',
        prompt:
          'soaring through a floating skyport with whimsical airships, musical kites, ribboned clouds, and curious sky creatures',
        thumbnail: '/variant-thumbnails/skyport-carousels.svg',
        tags: ['Floating', 'Music'],
      },
    ],
  },
  {
    id: 'seasonal-celebrations',
    title: 'Seasonal Celebrations',
    description: 'Limited-time festivities for holidays and changing seasons.',
    category: 'Seasonal',
    type: 'seasonal',
    seasonal: true,
    thumbnail: '/variant-thumbnails/pack-seasonal.svg',
    availabilityNote: 'Rotates monthly—mix and match with evergreen themes.',
    themes: [
      {
        id: 'winter',
        title: 'Winter Wonderland',
        description: 'Snowflakes, snowmen, and cozy scarves',
        prompt:
          'playing in a winter wonderland with snowflakes, snowmen, sleds, and cozy winter clothing',
        thumbnail: '/variant-thumbnails/winter.svg',
        tags: ['Snow', 'Cozy'],
      },
      {
        id: 'spring-bloom-festival',
        title: 'Spring Bloom Festival',
        description: 'Flower parades, fluttering ribbons, and garden critters',
        prompt:
          'celebrating a spring bloom festival with flower floats, fluttering ribbons, buzzing bees, and joyful garden critters',
        thumbnail: '/variant-thumbnails/spring-bloom-festival.svg',
        tags: ['Floral', 'Parade'],
      },
      {
        id: 'harvest-moon-market',
        title: 'Harvest Moon Market',
        description: 'Lanterns, hay bales, and pumpkin spice treats',
        prompt:
          'strolling through a harvest moon night market with lanterns, hay bales, pumpkin spice treats, and friendly forest animals',
        thumbnail: '/variant-thumbnails/harvest-moon-market.svg',
        tags: ['Autumn', 'Lanterns'],
      },
      {
        id: 'starlit-fireworks-festival',
        title: 'Starlit Fireworks Festival',
        description: 'Celebratory fireworks over a lakeside picnic',
        prompt:
          'enjoying a starlit fireworks festival over a calm lake with picnic blankets, sparklers, and joyful friends',
        thumbnail: '/variant-thumbnails/starlit-fireworks-festival.svg',
        tags: ['Fireworks', 'Celebration'],
      },
    ],
  },
  {
    id: 'community-spotlight',
    title: 'Community Spotlight',
    description: 'User-submitted prompts we love from families around the world.',
    category: 'Community',
    type: 'community',
    thumbnail: '/variant-thumbnails/pack-community.svg',
    availabilityNote: 'Refreshed weekly with new kid-approved ideas.',
    themes: [
      {
        id: 'galactic-parade',
        title: 'Galactic Parade',
        description: 'Community floats, confetti comets, and dancing aliens',
        prompt:
          'a community festival in outer space with whimsical parade floats, dancing aliens, confetti comets, and joyful music',
        thumbnail: '/variant-thumbnails/galactic-parade.svg',
        tags: ['Parade', 'Sci-fi'],
        submittedBy: 'Kai (age 9)',
      },
      {
        id: 'robot-bakery',
        title: 'Robot Bakery',
        description: 'Aproned robots icing cupcakes on conveyor belts',
        prompt:
          'a friendly robot bakery with aproned robots icing cupcakes on conveyor belts, gears decorated with frosting, and smiling customers',
        thumbnail: '/variant-thumbnails/robot-bakery.svg',
        tags: ['Sweet', 'Machines'],
        submittedBy: 'Priya & dad',
      },
      {
        id: 'city-rooftop-garden',
        title: 'City Rooftop Garden',
        description: 'Sunset veggies, string lights, and skyline views',
        prompt:
          'tending a city rooftop garden at sunset with string lights, vegetable planters, friendly neighbors, and skyline views',
        thumbnail: '/variant-thumbnails/city-rooftop-garden.svg',
        tags: ['Urban', 'Calm'],
        submittedBy: 'Mina (age 7)',
      },
    ],
  },
]

export const VARIANT_THEMES: VariantTheme[] = VARIANT_PACKS.flatMap(pack =>
  pack.themes.map(theme => ({
    ...theme,
    packId: pack.id,
    packTitle: pack.title,
    packType: pack.type,
    packCategory: pack.category,
    seasonal: Boolean(pack.seasonal),
  }))
)

export const VARIANT_THEME_LOOKUP: Record<string, VariantTheme> = Object.fromEntries(
  VARIANT_THEMES.map(theme => [theme.id, theme])
)

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
export function getThemePrompt(theme: VariantTheme): string {
  return theme.prompt
}
