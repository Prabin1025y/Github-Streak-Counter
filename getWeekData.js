export function getCurrentWeekData(last20Days) {
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  console.log(last20Days)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start of week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Map input by yyyy-mm-dd for O(1) lookup
  const dataMap = new Map(
    last20Days.map(({ date, value }) => [
      new Date(date).toISOString().slice(0, 10),
      value,
    ])
  );

  return DAYS.map((day, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);

    const key = date.toISOString().slice(0, 10);

    return {
      day,
      value: dataMap.get(key) ?? null,
    };
  });
}
