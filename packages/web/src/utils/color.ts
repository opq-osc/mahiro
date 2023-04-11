const colors = [
  'magenta',
  'red',
  'volcano',
  'orange',
  'gold',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
] as const

export const randomColor = (id?: number) => {
  if (!id) {
    return colors[0]
  }
  const index = id % colors.length
  return colors[index]
}
