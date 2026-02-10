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
    <image href="/fire.gif" x="276" y="20" width="140" height="140" />
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