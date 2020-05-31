export const findAvatar = (list: any[], id: any) => {
  const index = list.findIndex((it: any) => it.id == id);
  if (index >= 0) {
    return list[index].lowIconData;
  } else {
    return null;
  }
};
