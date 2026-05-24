/**
 * Inert SVG filter definitions, mounted once in __root.
 *
 * Three size variants of the wave-distortion filter:
 *   sm — links, blockquotes, h3 (paragraph-scale text)
 *   md — h2
 *   lg — h1 / .section-title (massive headings)
 *
 * Each warps its source via feDisplacementMap driven by stitched fractalNoise.
 * An feOffset animates the noise pattern upward by exactly one noise tile per
 * cycle — so the loop is seamless: dy = -tile_height = visually identical to
 * dy = 0 thanks to stitchTiles. Bigger variants use lower Y frequency so the
 * wave features stay proportional to the glyph size and the band reads as a
 * single travelling wave rather than fine jitter.
 *
 *   tile_y = 1 / baseFrequency_y
 *   sm:  1 / 0.020  =  50     dy → -50    (1 tile)
 *   md:  1 / 0.008  =  125    dy → -125   (1 tile)
 *   lg:  1 / 0.003  ≈  333    dy → -333   (1 tile)
 */
export default function GlitchFilter() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="text-wave-distort-sm" x="-10%" y="-15%" width="120%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018 0.02"
            numOctaves="2"
            seed="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feOffset in="noise" result="movingNoise">
            <animate
              id="text-wave-anim-sm"
              attributeName="dy"
              values="0;-50"
              dur="5s"
              repeatCount="indefinite"
              calcMode="linear"
              begin="indefinite"
            />
          </feOffset>
          <feDisplacementMap
            in="SourceGraphic"
            in2="movingNoise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="text-wave-distort-md" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.008"
            numOctaves="2"
            seed="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feOffset in="noise" result="movingNoise">
            <animate
              id="text-wave-anim-md"
              attributeName="dy"
              values="0;-125"
              dur="6s"
              repeatCount="indefinite"
              calcMode="linear"
              begin="indefinite"
            />
          </feOffset>
          <feDisplacementMap
            in="SourceGraphic"
            in2="movingNoise"
            scale="32"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <filter id="text-wave-distort-lg" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.003"
            numOctaves="2"
            seed="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feOffset in="noise" result="movingNoise">
            <animate
              id="text-wave-anim-lg"
              attributeName="dy"
              values="0;-333"
              dur="10s"
              repeatCount="indefinite"
              calcMode="linear"
              begin="indefinite"
            />
          </feOffset>
          <feDisplacementMap
            in="SourceGraphic"
            in2="movingNoise"
            scale="55"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
