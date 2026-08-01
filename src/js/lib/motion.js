export const clamp01 = (value) => Math.max(0, Math.min(1, value));

export const smoothStep = (value) => {
  const amount = clamp01(value);
  return amount * amount * (3 - 2 * amount);
};

export const getLoopPoint = (phase, width, height) => {
  const angle = phase * Math.PI * 2;
  return {
    x: width * (0.5 + Math.sin(angle) * 0.36),
    y: height * (0.5 - Math.sin(angle * 2) * 0.23),
  };
};

export const invertMoveToken = (token) => {
  if (token.endsWith("2")) return token;
  return token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
};
