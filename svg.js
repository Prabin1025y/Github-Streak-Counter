export function generateStatsDashboardSVG({
  contributionsThisYear = '0',
  currentStreak = '0',
  daysThisYear = '0',
  weeklyData = [
    { day: 'SUN', value: 10 },
    { day: 'MON', value: 10 },
    { day: 'TUE', value: 10 },
    { day: 'WED', value: 10 },
    { day: 'THU', value: null },
    { day: 'FRI', value: null },
    { day: 'SAT', value: null },
  ],
  todaysIndex
} = {}) {
  console.log(todaysIndex)
  // Calculate background bar width (fixed at 4 days)
  const backgroundWidth = parseInt(todaysIndex) * 70 - 35;
  
  let svg = `<svg viewBox="0 0 668 420" width="668" height="420" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-2xl">`;
  
  // Defs
  svg += `
  <defs>
    <linearGradient id="textGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFDF5F" />
      <stop offset="100%" stop-color="#FF650A" />
    </linearGradient>
    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFDF5F" />
      <stop offset="100%" stop-color="#FF650A" />
    </linearGradient>
  </defs>`;
  
  // Background
  svg += `
  <rect width="668" height="420" fill="#0f1419" />`;
  
  // Border
  svg += `
  <rect x="8" y="8" width="652" height="404" rx="20" ry="20" fill="none" stroke="url(#textGradient)" stroke-width="3" />`;
  
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
    <text x="334" y="270" font-size="30" font-weight="bold" fill="url(#textGradient)" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${currentStreak > 1 ? "Days" : "Day"} Streak</text>
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
  
  // Background bar with new styling
  if (weeklyData.length > 0) {
    svg += `
    <rect x="112" y="370" width="${backgroundWidth}" height="32" rx="16" fill="#ab735262" stroke="url(#textGradient)" stroke-width="1" />`;
  }
  
  // Loop through weekly data
  for (let index = 0; index < weeklyData.length; index++) {
    const item = weeklyData[index];
    const baseX = 130 + index * 70;
    const isActive = item.value !== null;
    const isHighlight = index === (todaysIndex - 1); // Wednesday
    
    svg += `
    <g>
      <text x="${baseX}" y="355" font-size="14" fill="#9ca3af" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${item.day}</text>`;
    
    if (isActive) {
      if (isHighlight) {
        svg += `
      <rect x="${baseX - 15}" y="370" width="32" height="32" rx="16" fill="url(#textGradient)" />`;
      }
      svg += `
      <text x="${baseX}" y="392" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${item.value}</text>`;
    } else {
      svg += `
      <text x="${baseX}" y="392" font-size="16" fill="#6b7280" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">-</text>`;
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

// // Usage:
// const svgString = generateStatsDashboardSVG({
//   leftStat: { number: '150', label: 'Contributions This Year' },
//   centerStat: { number: '7', label: 'Day Streak' },
//   rightStat: { number: '100', label: 'Days This Year' },
//   weeklyData: [
//     { day: 'SUN', value: 5 },
//     { day: 'MON', value: 8 },
//     { day: 'TUE', value: 12 },
//     { day: 'WED', value: 15 },
//     { day: 'THU', value: null },
//     { day: 'FRI', value: null },
//     { day: 'SAT', value: null },
//   ]
// });

// console.log(svgString);