export function generateStatsDashboardSVG({
  contributionsThisYear = '0',
  currentStreak = '0',
  daysThisYear = '0',
  weeklyData = [
    { day: 'SUN', value: 0 },
    { day: 'MON', value: 0 },
    { day: 'TUE', value: 0 },
    { day: 'WED', value: 0 },
    { day: 'THU', value: null },
    { day: 'FRI', value: null },
    { day: 'SAT', value: null },
  ],
  todaysIndex
} = {}) {

  const streakCount = parseInt(currentStreak) || 0;
  const todayIdx = parseInt(todaysIndex) - 1; // 0-based

  // How many of the streak days fall within this week?
  // e.g. streak=10, todayIdx=3 => all 4 days this week (0..3) are in streak
  // e.g. streak=2,  todayIdx=3 => only days 2..3 are in streak
  const streakDaysThisWeek = Math.min(streakCount, todayIdx + 1);
  const streakStartIdx = todayIdx - streakDaysThisWeek + 1; // 0-based, within this week

  const dayStep = 70;
  const firstDayX = 116;
  const barY = 370;
  const barHeight = 32;
  const barRx = 16;

  // Width of a bar spanning `count` days
  const barWidth = (count) => count * dayStep - 38;

  let svg = `<svg viewBox="0 0 668 420" width="668" height="420" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-2xl">`;

  // Defs
  svg += `
  <defs>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFDF5F" />
      <stop offset="100%" stop-color="#FF650A" />
    </linearGradient>
    <linearGradient id="textGradientDim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#aaaaaa" />
      <stop offset="100%" stop-color="#464646" />
    </linearGradient>
    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFDF5F" />
      <stop offset="100%" stop-color="#FF650A" />
    </linearGradient>
  </defs>`;

  // Background
  svg += `
  <rect width="668" height="420" fill="none" />`;

  // Border
  svg += `
  <rect x="8" y="8" width="652" height="404" rx="20" ry="20" fill="#0f1419" stroke="url(#textGradient)" stroke-width="3" />`;

  // Left stat section
  svg += `
  <g>
    <text x="107" y="190" font-size="40" font-weight="bold" fill="url(#textGradient)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${contributionsThisYear}</text>
    <text x="107" y="230" font-size="18" fill="#f59e0b" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Contributions</text>
    <text x="107" y="250" font-size="18" fill="#f59e0b" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">This Year</text>
    <rect x="198.5" y="50" width="2" height="240" fill="url(#textGradient)" />
  </g>`;

  // Center stat section
  svg += `
  <g>
    <g transform="translate(295, 41) scale(0.45)">
      <defs>
        <linearGradient id="fireGradient" gradientUnits="userSpaceOnUse" x1="94.141" y1="255" x2="94.141" y2="0.188">
          <stop offset="0" stop-color="#ff4c0d"></stop>
          <stop offset="1" stop-color="#fc9502"></stop>
        </linearGradient>
      </defs>
      <g transform="matrix(-1, 0, 0, 1, 188, 0)">
        <path d="M187.899,164.809 C185.803,214.868 144.574,254.812 94.000,254.812 C42.085,254.812 -0.000,211.312 -0.000,160.812 C-0.000,154.062 -0.121,140.572 10.000,117.812 C16.057,104.191 19.856,95.634 22.000,87.812 C23.178,83.513 25.469,76.683 32.000,87.812 C35.851,94.374 36.000,103.812 36.000,103.812 C36.000,103.812 50.328,92.817 60.000,71.812 C74.179,41.019 62.866,22.612 59.000,9.812 C57.662,5.384 56.822,-2.574 66.000,0.812 C75.352,4.263 100.076,21.570 113.000,39.812 C131.445,65.847 138.000,90.812 138.000,90.812 C138.000,90.812 143.906,83.482 146.000,75.812 C148.365,67.151 148.400,58.573 155.999,67.813 C163.226,76.600 173.959,93.113 180.000,108.812 C190.969,137.321 187.899,164.809 187.899,164.809 Z" fill="url(#fireGradient)" fill-rule="evenodd"></path>
        <path d="M94.000,254.812 C58.101,254.812 29.000,225.711 29.000,189.812 C29.000,168.151 37.729,155.000 55.896,137.166 C67.528,125.747 78.415,111.722 83.042,102.172 C83.953,100.292 86.026,90.495 94.019,101.966 C98.212,107.982 104.785,118.681 109.000,127.812 C116.266,143.555 118.000,158.812 118.000,158.812 C118.000,158.812 125.121,154.616 130.000,143.812 C131.573,140.330 134.753,127.148 143.643,140.328 C150.166,150.000 159.127,167.390 159.000,189.812 C159.000,225.711 129.898,254.812 94.000,254.812 Z" fill="#fc9502" fill-rule="evenodd"></path>
        <path d="M95.000,183.812 C104.250,183.812 104.250,200.941 116.000,223.812 C123.824,239.041 112.121,254.812 95.000,254.812 C77.879,254.812 69.000,240.933 69.000,223.812 C69.000,206.692 85.750,183.812 95.000,183.812 Z" fill="#fce202" fill-rule="evenodd"></path>
      </g>
    </g>
    <text x="334" y="230" font-size="72" font-weight="bold" fill="url(#textGradient)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${currentStreak}</text>
    <text x="334" y="270" font-size="30" font-weight="bold" fill="url(#textGradient)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${parseInt(currentStreak) > 1 ? "Days" : "Day"} Streak</text>
    <rect x="468" y="50" width="2" height="240" fill="url(#textGradient)" />
  </g>`;

  // Right stat section
  svg += `
  <g>
    <text x="561" y="190" font-size="40" font-weight="bold" fill="url(#textGradient)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${daysThisYear}</text>
    <text x="561" y="230" font-size="18" fill="#f59e0b" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">Days</text>
    <text x="561" y="250" font-size="18" fill="#f59e0b" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">This Year</text>
  </g>`;

  // Weekly activity chart
  svg += `
  <g>`;

  // Figure out which days have value > 0 before the streak window
  // These are indices 0..(streakStartIdx-1) with value > 0
  // Since active days are always consecutive, we just need to count them
  let preStreakActiveCount = 0;
  for (let i = 0; i < streakStartIdx; i++) {
    if (weeklyData[i] && weeklyData[i].value > 0) {
      preStreakActiveCount++;
    }
  }

  // Pre-streak bar (dimmer) — only if there are active days before streak window
  if (preStreakActiveCount > 0) {
    const preBarX = firstDayX;
    const preBarWidth = barWidth(preStreakActiveCount);
    svg += `
    <rect x="${preBarX}" y="${barY}" width="${preBarWidth}" height="${barHeight}" rx="${barRx}" fill="#3d2e1e" stroke="#6b4c2a" stroke-width="1" />`;
  }

  // Streak bar — only if there are streak days with value > 0 this week
  let streakActiveCount = 0;
  for (let i = streakStartIdx; i <= todayIdx; i++) {
    if (weeklyData[i] && weeklyData[i].value > 0) {
      streakActiveCount++;
    }
  }

  if (streakActiveCount > 0) {
    // Bar starts at the first active streak day
    const streakBarX = firstDayX + streakStartIdx * dayStep;
    const streakBarWidth = barWidth(streakDaysThisWeek);
    svg += `
    <rect x="${streakBarX}" y="${barY}" width="${streakBarWidth}" height="${barHeight}" rx="${barRx}" fill="#ab735262" stroke="url(#textGradient)" stroke-width="1" />`;
  }

  // Loop through weekly data
  for (let index = 0; index < weeklyData.length; index++) {
    const item = weeklyData[index];
    const baseX = 132 + index * dayStep;
    const isActiveDay = item.value !== null && item.value > 0;
    const isToday = index === todayIdx;
    const isInStreak = index >= streakStartIdx && index <= todayIdx;

    svg += `
    <g>
      <text x="${baseX}" y="355" font-size="14" fill="#9ca3af" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${item.day}</text>`;

    if (item.value === null) {
      // Future/unknown
      svg += `
      <text x="${baseX}" y="392" font-size="16" fill="#6b7280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">-</text>`;
    } else if (item.value === 0) {
      // Happened but no contributions — no bar, just show 0
      if (isToday) {
        svg += `
      <rect x="${baseX - 15}" y="${barY}" width="32" height="32" rx="16" fill="url(#textGradientDim)" />`;
        svg += `
      <text x="${baseX}" y="392" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">0</text>`;
      } else {
        svg += `
      <text x="${baseX}" y="392" font-size="14" font-weight="600" fill="#6b7280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">0</text>`;
      }
    } else {
      // value > 0 — active day
      if (isToday) {
        svg += `
      <rect x="${baseX - 15}" y="${barY}" width="32" height="32" rx="16" fill="url(#textGradient)" />`;
      }
      svg += `
      <text x="${baseX}" y="392" font-size="14" font-weight="600" fill="${isInStreak ? '#ffffff' : '#9ca3af'}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${item.value}</text>`;
    }

    svg += `
    </g>`;
  }

  svg += `
  </g>`;

  svg += `
</svg>`;

  return svg;
}