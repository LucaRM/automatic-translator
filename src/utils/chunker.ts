/**
 * Chunks a string into smaller pieces based on the specified size
 * @param text - The text to chunk
 * @param chunkSize - Maximum size of each chunk (default: 300)
 * @returns Array of text chunks
 */
export function chunkText(text: string, chunkSize: number = 300): string[] {
  if (!text || text.length === 0) {
    return [];
  }

  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = currentIndex + chunkSize;

    // If we're not at the end of the string, try to break at a sentence or word boundary
    if (endIndex < text.length) {
      // Look for sentence endings (. ! ?) within the last 50 characters
      const searchStart = Math.max(currentIndex, endIndex - 50);
      const segment = text.substring(searchStart, endIndex);
      const sentenceMatch = segment.match(/[.!?]\s/g);
      
      if (sentenceMatch) {
        const lastSentenceEnd = segment.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
        endIndex = searchStart + lastSentenceEnd + 2; // +2 to include the punctuation and space
      } else {
        // If no sentence boundary, look for a space
        const lastSpace = text.lastIndexOf(' ', endIndex);
        if (lastSpace > currentIndex) {
          endIndex = lastSpace + 1;
        }
      }
    }

    chunks.push(text.substring(currentIndex, endIndex).trim());
    currentIndex = endIndex;
  }

  return chunks;
}
