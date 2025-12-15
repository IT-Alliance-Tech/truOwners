export const removeUnderScore = (str) => {
  return (
    String(str)?.charAt(0)?.toUpperCase() +
    String(str)?.slice(1)?.replace(/_/g, " ")
  );
};