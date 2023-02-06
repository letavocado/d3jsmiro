const uniq = (arr) =>
  arr.filter(
    (v, i, a) => a.findIndex((val) => v.x === val.x && v.y === val.y) === i
  )

export { uniq }
