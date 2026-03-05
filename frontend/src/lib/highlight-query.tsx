export function highlightQueryInText(
  text: string,
  query: string,
  maxLength: number = 80,
): React.ReactNode {
  if (!query || !text) return text ?? "";

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "\u2026";
  }

  let start = 0;
  let end = text.length;
  let prefixEllipsis = false;
  let suffixEllipsis = false;

  if (text.length > maxLength) {
    const matchEnd = matchIndex + query.length;
    const available = maxLength - query.length;
    const before = Math.floor(available / 2);
    const after = available - before;

    start = Math.max(0, matchIndex - before);
    end = Math.min(text.length, matchEnd + after);

    if (start === 0) {
      end = Math.min(text.length, maxLength);
    } else if (end === text.length) {
      start = Math.max(0, text.length - maxLength);
    }

    prefixEllipsis = start > 0;
    suffixEllipsis = end < text.length;
  }

  const adjustedMatchIndex = matchIndex - start;
  const truncated = text.slice(start, end);
  const beforeMatch = truncated.slice(0, adjustedMatchIndex);
  const match = truncated.slice(adjustedMatchIndex, adjustedMatchIndex + query.length);
  const afterMatch = truncated.slice(adjustedMatchIndex + query.length);

  return (
    <>
      {prefixEllipsis && "\u2026"}
      {beforeMatch}
      <strong className="font-semibold">{match}</strong>
      {afterMatch}
      {suffixEllipsis && "\u2026"}
    </>
  );
}
