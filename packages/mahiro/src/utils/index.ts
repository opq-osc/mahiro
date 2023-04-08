export const toArrayNumber = (strArr: string) => {
  const arr = strArr.split(',')
  return arr.filter(Boolean).map((i) => Number(i))
}

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
