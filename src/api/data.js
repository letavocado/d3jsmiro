/**
 * Mocking client-server processing
 */
// eslint-disable-next-line no-underscore-dangle
const _data = {
  nodes: [
    {
      name: 'A',
      x: 200,
      y: 100,
      height: 100,
      width: 100,
    },
    {
      name: 'B',
      x: 800,
      y: 100,
      height: 100,
      width: 100,
    },
    {
      name: 'C',
      x: 200,
      y: 500,
      height: 100,
      width: 100,
    },
    {
      name: 'D',
      x: 800,
      y: 500,
      height: 100,
      width: 100,
    },
  ],
  links: [],
}

export default {
  getData() {
    return _data
  },
}
