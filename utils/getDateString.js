export function getFormattedStartAndEndDates(startDate, endDate) {
    const startDateString = startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}) : 'N/A';
    const endDateString = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}) : 'N/A';
    return `${startDateString} - ${endDateString}`;
}