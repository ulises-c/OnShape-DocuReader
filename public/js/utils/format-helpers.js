/**
 * Formatting helpers (pure functions)
 */

export function formatDateWithUser(dateStr, userObj) {
  if (!dateStr) return 'Unknown';
  try {
    const date = new Date(dateStr);
    const userName = userObj?.name || 'Unknown User';
    const options = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    const formattedDate = date.toLocaleString('en-US', options);
    return `${formattedDate} [${userName}]`;
  } catch {
    return `Invalid Date [${userObj?.name || 'Unknown User'}]`;
  }
}
