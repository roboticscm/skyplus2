export const extractTemplate = (str: string, startToken: string, endToken: string) => {
  const startIndex = str.indexOf(startToken) + startToken.length;
  const endIndex = str.indexOf(endToken);
  if (startIndex < 0 || endIndex < 0 || startIndex > endIndex) {
    return str;
  }

  return str.slice(startIndex, endIndex);
};
