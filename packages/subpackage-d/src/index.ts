import { BAD_TYPE, OTHER_BAD } from "fake-dep";

export const bad = (arg: BAD_TYPE) => {
  return arg;
};

const other_bad: OTHER_BAD = 1;

console.log(bad);
