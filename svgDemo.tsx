interface WeeklyData {
  day: string;
  value: number | null;
}

interface StatsDashboardProps {
  leftStat: {
    number: string;
    label: string;
  };
  centerStat: {
    number: string;
    label: string;
  };
  rightStat: {
    number: string;
    label: string;
  };
  weeklyData?: WeeklyData[];
}

export function StatsDashboard({
  leftStat,
  centerStat,
  rightStat,
  weeklyData = [
    { day: 'SUN', value: 10 },
    { day: 'MON', value: 10 },
    { day: 'TUE', value: 10 },
    { day: 'WED', value: 10 },
    { day: 'THU', value: null },
    { day: 'FRI', value: null },
    { day: 'SAT', value: null },
  ],
}: StatsDashboardProps) {
  return (
    <svg
      viewBox="0 0 668 420"
      width="668"
      height="420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-2xl"
    >
      <defs>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFDF5F" />
          <stop offset="100%" stopColor="#FF650A" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDF5F" />
          <stop offset="100%" stopColor="#FF650A" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="668" height="420" fill="#0f1419" />

      {/* Border - Rounded rectangle */}
      <rect
        x="8"
        y="8"
        width="652"
        height="404"
        rx="20"
        ry="20"
        fill="none"
        stroke="url(#textGradient)"
        strokeWidth="3"
      />

      {/* Left stat section */}
      <g>
        {/* Number */}
        <text
          x="107"
          y="190"
          fontSize="40"
          fontWeight="bold"
          fill="url(#textGradient)"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {leftStat.number}
        </text>

        {/* Label */}
        <text
          x="107"
          y="230"
          fontSize="18"
          fill="#f59e0b"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Contributions
        </text>
        <text
          x="107"
          y="250"
          fontSize="18"
          fill="#f59e0b"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          This Year
        </text>

        {/* Vertical line */}
        <rect
          x="198.5"
          y="50"
          width="2"
          height="240"
          fill="url(#textGradient)"
        />
      </g>

      {/* Center stat section with flame icon */}
      <g>
        {/* Flame icon image */}
        <image
          href="/fire-icon.jpg"
          x="294"
          y="55"
          width="80"
          height="80"
        />

        {/* Number */}
        <text
          x="334"
          y="220"
          fontSize="72"
          fontWeight="bold"
          fill="url(#textGradient)"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {centerStat.number}
        </text>

        {/* Label */}
        <text
          x="334"
          y="260"
          fontSize="18"
          fontWeight="bold"
          fill="url(#textGradient)"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {centerStat.label}
        </text>

        {/* Vertical line */}
        <rect
          x="468"
          y="50"
          width="2"
          height="240"
          fill="url(#textGradient)"
        />
      </g>

      {/* Right stat section */}
      <g>
        {/* Number */}
        <text
          x="561"
          y="190"
          fontSize="40"
          fontWeight="bold"
          fill="url(#textGradient)"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {rightStat.number}
        </text>

        {/* Label */}
        <text
          x="561"
          y="230"
          fontSize="18"
          fill="#f59e0b"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Days
        </text>
        <text
          x="561"
          y="250"
          fontSize="18"
          fill="#f59e0b"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          This Year
        </text>
      </g>

      {/* Weekly activity chart */}
      <g>
        {/* Connected background bar for active days */}
        {weeklyData.length > 0 && (
          <rect
            x="152"
            y="370"
            width={4 * 70 - 35}
            height="32"
            rx="16"
            opacity="0.8"
            fill="#AB7252"
            stroke="#FF650A"
            strokeWidth="1"
          />
        )}

        {/* Days of week and values */}
        {weeklyData.map((item, index) => {
          const baseX = 170 + index * 70;
          const isActive = item.value !== null;
          const isHighlight = index === 3; // Highlight 4th day (Wednesday)

          return (
            <g key={index}>
              {/* Day label */}
              <text
                x={baseX}
                y="355"
                fontSize="14"
                fill="#9ca3af"
                textAnchor="middle"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {item.day}
              </text>

              {/* Value or dash */}
              <g>
                {isActive ? (
                  <>
                    {/* Rounded rectangle background - connected */}
                    {isHighlight && <rect
                      x={baseX - 15}
                      y="370"
                      width="32"
                      height="32"
                      rx="16"
                      fill="url(#textGradient)"
                    />}
                    {/* Value text */}
                    <text
                      x={baseX}
                      y="392"
                      fontSize="14"
                      fontWeight="600"
                      fill="#ffffff"
                      textAnchor="middle"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {item.value}
                    </text>
                  </>
                ) : (
                  <text
                    x={baseX}
                    y="392"
                    fontSize="16"
                    fill="#6b7280"
                    textAnchor="middle"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    -
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
