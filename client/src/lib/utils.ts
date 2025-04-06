import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines classNames with Tailwind's utility classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates reading time for article content
 * @param content Article content as string
 * @returns Reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const textLength = content.split(/\s+/).length;
  const readingTime = Math.ceil(textLength / wordsPerMinute);
  return readingTime < 1 ? 1 : readingTime;
}

/**
 * Formats a date for display
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Truncates text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Creates a URL-friendly slug from a string
 * @param text Text to convert to slug
 * @returns URL-friendly slug
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Extracts plain text content from HTML
 * @param html HTML content
 * @returns Plain text content
 */
export function htmlToPlainText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Creates an excerpt from article content
 * @param content Article content
 * @param maxLength Maximum length of excerpt
 * @returns Article excerpt
 */
export function createExcerpt(content: string, maxLength = 150): string {
  const plainText = typeof content === 'string' 
    ? htmlToPlainText(content) 
    : '';
  return truncateText(plainText, maxLength);
}
