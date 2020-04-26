import { getRandomInt } from '@/lib/js/util';

let passwordChars = ['○', '☺', '☓', '✳', '✾', '✌', '♛'];

export const passwordChar = () => {
  const randIndex = getRandomInt(0, passwordChars.length - 1);
  return passwordChars[randIndex];
};
