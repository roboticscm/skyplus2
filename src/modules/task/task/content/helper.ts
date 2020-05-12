export const findRemoveAndInsertFile = (isUpdateMode: boolean, array1: any[], array2: any[]) => {
  let insert, remove: any[];
  if (isUpdateMode) {
    remove = array1 && array2 ? array1.filter((it: string) => array2.findIndex((me: string) => me == it) < 0) : [];
    insert = array1 && array2 ? array2.filter((it: string) => array1.findIndex((me: string) => me == it) < 0) : array2;
  } else {
    remove = [];
    insert = array2;
  }

  if (!insert) {
    insert = [];
  }

  return [remove.filter((it: any) => it !== null), insert.filter((it: any) => it !== null)];
};

export const findRemoveAndInsertItem = (isUpdateMode: boolean, array1: any[], array2: any[]) => {
  let insert, remove: any[];
  if (isUpdateMode) {
    remove = array1 && array2 ? array1.filter((it: any) => array2.findIndex((me: any) => me.id == it.id) < 0) : [];
    insert = array1 && array2 ? array2.filter((it: any) => array1.findIndex((me: any) => me.id == it.id) < 0) : array2;
  } else {
    remove = [];
    insert = array2;
  }

  return [
    remove.map((it: any) => it.id).filter((it: any) => it !== null),
    insert.map((it: any) => it.id).filter((it: any) => it !== null),
  ];
};

export const findRemoveAndInsertStatusDetail = (isUpdateMode: boolean, array1: any[], array2: any[]) => {
  let insert, remove: any[];
  if (isUpdateMode) {
    remove = array1 && array2 ? array1.filter((it: any) => array2.findIndex((me: any) => me.id == it.id) < 0) : [];
    insert = array1 && array2 ? array2.filter((it: any) => array1.findIndex((me: any) => me.id == it.id) < 0) : array2;
  } else {
    remove = [];
    insert = array2;
  }

  return [remove.filter((it: any) => it.id !== null), insert.filter((it: any) => it !== null)];
};

export const findEditStatusDetail = (array1: any[], array2: any[]) => {
  let arr1, arr2: any[];
  arr1 =
    array1 && array2
      ? array1.filter((it: any) => array2.findIndex((me: any) => me.id == it.id && it.id !== null) >= 0)
      : [];
  arr2 =
    array1 && array2
      ? array2.filter((it: any) => array1.findIndex((me: any) => me.id == it.id && it.id !== null) >= 0)
      : [];

  return [arr1.filter((it: any) => it !== null), arr2.filter((it: any) => it !== null)];
};
