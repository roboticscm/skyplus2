export const getMenuPathFromUrl = () => {
  return location.pathname.slice(1).replace('--', '/');
};
