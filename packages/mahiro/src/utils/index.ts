export const toArrayNumber = (strArr: string) => {
  const arr = strArr.split(',')
  return arr.filter(Boolean).map((i) => Number(i))
}
