export const highlightText = (text, query) => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');

  const parts = text.split(regex);

  return parts.map((part, idx) =>
    regex.test(part) ? (
      <span key={idx} style={{ backgroundColor: 'yellow', padding: '0 1px' }}>
        {part}
      </span>
    ) : (
      part
    )
  );
};