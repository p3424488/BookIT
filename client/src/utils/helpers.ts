// Format date to readable string
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format duration from minutes
export const formatDuration = (mins: number): string => {
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Format price to Indian rupees
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

// Get category emoji
export const getCategoryEmoji = (category: string): string => {
  const emojis: { [key: string]: string } = {
    Movie: '🎬',
    Concert: '🎸',
    Sports: '🏏',
    Theatre: '🎭',
    Comedy: '😂',
    Dance: '💃',
  };
  return emojis[category] || '🎪';
};

// Get category color
export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    Movie: 'bg-blue-100 text-blue-800',
    Concert: 'bg-purple-100 text-purple-800',
    Sports: 'bg-green-100 text-green-800',
    Theatre: 'bg-yellow-100 text-yellow-800',
    Comedy: 'bg-orange-100 text-orange-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};