const banglaDigits: Record<string, string> = {
  "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
  "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
};

export function convertToBanglaDigits(num: number | string): string {
  return num.toString().split("").map(digit => banglaDigits[digit] || digit).join("");
}

const banglaWeekdays = [
  "রোববার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"
];

const banglaMonths = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];

export function getBanglaDate(date: Date = new Date()): string {
  const dayName = banglaWeekdays[date.getDay()];
  const day = convertToBanglaDigits(date.getDate());
  const monthName = banglaMonths[date.getMonth()];
  const year = convertToBanglaDigits(date.getFullYear());
  
  return `${dayName}, ${day} ${monthName} ${year}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = convertToBanglaDigits(date.getDate());
  const monthName = banglaMonths[date.getMonth()];
  const year = convertToBanglaDigits(date.getFullYear());
  return `${day} ${monthName} ${year}`;
}

export function formatDateShort(dateStr: string): string {
  return formatDate(dateStr);
}

export function calculateReadingTime(body: string): number {
  const wordsPerMinute = 200;
  const words = body.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}

export function getRelativeTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? "এইমাত্র" : `${convertToBanglaDigits(diffMins)} মিনিট আগে`;
  } else if (diffHours < 24) {
    return `${convertToBanglaDigits(diffHours)} ঘণ্টা আগে`;
  } else if (diffDays === 1) {
    return "গতকাল";
  } else {
    return `${convertToBanglaDigits(diffDays)} দিন আগে`;
  }
}

export function getCategoryBadgeClasses(slug: string): string {
  switch (slug) {
    case "politics":
      return "bg-red-600 text-white";
    case "economy":
      return "bg-emerald-600 text-white";
    case "international":
      return "bg-blue-600 text-white";
    case "sports":
      return "bg-orange-500 text-white";
    case "sci-tech":
      return "bg-purple-600 text-white";
    case "entertainment":
      return "bg-pink-600 text-white";
    case "national":
      return "bg-cyan-600 text-white";
    case "features":
      return "bg-amber-600 text-white";
    default:
      return "bg-rose-600 text-white";
  }
}