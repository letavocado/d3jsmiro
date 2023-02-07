import {
  select,
  selectAll,
  drag,
  curveStep,
  curveStepBefore,
  line,
  link,
  pointer,
  curveStepAfter,
} from 'd3'

import { uniq } from './utils'
import dataApi from '../api/data'

const { nodes, links } = dataApi.getData()
const width = +window.innerWidth
const height = +window.innerHeight

const svg = select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .on('mousemove', mousemove)
  .on('mousedown', function () {
    nodeG.classed('drawing', true)
  })
  .on('mouseup', (e) => {
    nodeG.classed('drawing', false)

    if (e.target.dataset?.type !== 'point') {
      isDrawLink = false
      resetDrawPoints()
      if (drawingLine) {
        drawingLine.remove()
      }
    }
  })

const textItem = svg
  .append('text')
  .attr('x', 0)
  .attr('y', 0)
  .attr('dy', '.75em')
  .attr('pointer-events', 'none')
  .text('0 : 0')

const mainG = svg.append('g').attr('id', 'main-g')
const linkG = mainG.append('g').attr('id', 'link-g')
const nodeG = mainG.append('g').attr('id', 'node-g')
const linkPoints = mainG.append('g').attr('id', 'linkPointsG')
const pointsG = null

const dragNodes = drag().on('drag', dragged)
const dragPoints = drag().on('drag', pointsDragged)

let drawSourceNode
let drawTargetNode
let tempSourceData
let tempTargetData

let isDrawLink = false
let drawingLine
let drawLinePointStart
let drawLinePointEnd

const lineGenerator = line()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(curveStepAfter)

// linkG
//   .append('path')
//   .attr(
//     'd',
//     lineGenerator([
//       { x: 850, y: 85 },
//       { x: 785, y: 85 },
//       { x: 785, y: 550 },
//       { x: 800, y: 550 },
//     ])
//   )
//   .attr('fill', 'none')
//   .attr('stroke', '#ffd02f')
//   .attr('stroke-width', '3px')

// Initialize the nodes
function renderNodes(selection) {
  selection
    .selectAll('rect.node__rect')
    .data((e) => [e])
    .join('rect')
    .attr('class', 'node__rect')
    .attr('x', (d) => d.x + d.width / 2)
    .attr('y', (d) => d.y + d.height / 2)
    .style('fill', 'transparent')
    .style('stroke', '#56445D')
    .style('stroke-width', '2px')
    .call(dragNodes)
    .transition()
    .duration(300)
    .attr('width', (d) => d.width)
    .attr('height', (d) => d.height)
    .attr('x', (d) => d.x)
    .attr('y', (d) => d.y)
}

function dragged(e, d) {
  resetDrawPoints()

  d.x += e.dx
  d.y += e.dy

  const node = select(this)
  node.attr('x', d.x).attr('y', d.y)

  // linkG.selectAll('path').join('path').attr('d', linke)
  const nodeData = node.data()[0]
  select(node.node().parentElement).call(dragCircles, nodeData)

  // console.log(node.node())
  // console.log(node.node().parentElement)
  // d3.event exposes dx and dy, which tell us how far the target has been
  // dragged since the last "drag" event, so we just update the x and y
  // properties on that datum and update the SVG.
  // console.log('Lets see:', d, data[1])
  // d.x += e.dx
  // d.y += e.dy
  // update()
}

function dragCircles(selection, data) {
  selection.selectAll('g.circle-g').each(function (e, i) {
    select(this).data([updateSinglePoints(data, i)])
    select(this.firstChild).data([updateSinglePoints(data, i)])
    select(this.firstChild.nextElementSibling).data([
      updateSinglePoints(data, i),
    ])

    select(this).attr('transform', (d) => `translate(${d.x}, ${d.y})`)
  })
}

function pointsDragged(selection) {
  // console.log(this)
  const [x, y] = pointer(this)
  this.attr('cx', x).attr('cy', y).attr('r', 5).attr('pointer-events', 'none')

  drawingLine.attr('d', () => {
    return renderPath({
      source: tempSourceData,
      target: { x, y },
    })
  })
}

function renderPoints(selection) {
  const circleG = selection
    .selectAll('g.circle-g')
    .data((e) => create4Points(e))
    .join('g')
    .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
    .attr('class', 'circle-g')

  circleG
    .append('circle')
    .attr('r', 4)
    .attr('fill', 'transparent')
    .attr('data-type', 'point')
    .attr('class', 'circle-g')
    .on('mouseup', mouseup)

  circleG
    .append('circle')
    .attr('class', 'node__circle')
    .attr('data-type', 'point')
    .attr('r', 0)
    .attr('fill', 'white')
    .attr('stroke', '#0000FF')
    .on('mousedown', mousedown)
    .transition()
    .duration(500)
    .attr('r', '4')
}

function resetDrawPoints() {
  if (drawLinePointStart) drawLinePointStart.remove()
  if (drawLinePointEnd) drawLinePointEnd.remove()
}

function mousedown(event) {
  // pointsG = linkG.append('g').attr('class', 'points')

  resetDrawPoints()
  const [x, y] = pointer(event, svg)
  isDrawLink = true

  drawSourceNode = event
  const selectSource = select(event.target)
  tempSourceData = selectSource.data()[0]

  drawingLine = linkG
    .append('path')
    .attr('d', () => {
      return renderPath({
        source: tempSourceData,
        target: { x, y },
      })
    })
    .attr('fill', 'none')
    .attr('stroke', '#ffd02f')
    .attr('stroke-width', '3px')

  drawLinePointStart = linkPoints
    .append('circle')
    .attr('cx', tempSourceData.x)
    .attr('cy', tempSourceData.y)
    .attr('r', 5)
    .attr('class', 'draw-line__point_start')
    .call(dragPoints)

  drawLinePointEnd = linkPoints
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', 0)
    .attr('class', 'draw-line__point_end')
    .call(dragPoints)

  // .on('mousedown', function (e) {
  //   mousemove(e)
  //   console.log(e)
  //   console.log('drag')
  // })
}

function mousemove(event) {
  // remove
  const [x, y] = pointer(event)
  textItem.text(`x: ${x}, y: ${y}`)
  // remove

  if (isDrawLink) {
    const [x, y] = pointer(event)
    const data = select(event.target).data()[0]
    let target = {
      x,
      y,
    }

    const {
      source: { name: sourceName },
    } = tempSourceData

    const isSameNode = sourceName === data?.source?.name

    if (data?.position && !isSameNode) {
      target = data
    }

    drawLinePointEnd
      .attr('cx', target.x)
      .attr('cy', target.y)
      .attr('r', 5)
      .attr('pointer-events', 'none')

    drawingLine.attr('d', () => {
      return renderPath({
        source: tempSourceData,
        target,
      })
    })
  }
}

function mouseup(event) {
  // pointsG.remove()
  // pointsG = null
  if (isDrawLink) {
    drawLinePointEnd.attr('pointer-events', 'all')

    const selectTarget = select(event.target)
    tempTargetData = selectTarget.data()[0]
    isDrawLink = false
    const pathIndex = 0
    const abc = links.filter(
      (e) =>
        e.source.source.name === tempSourceData.source.name &&
        e.target.source.name === tempTargetData.source.name
    )
    const samePoints = links.filter(
      (e) =>
        e.source.source.name === tempSourceData.source.name &&
        e.source.position === tempSourceData.position &&
        e.target.source.name === tempTargetData.source.name &&
        e.source.position === tempTargetData.position
    )
    if (samePoints.length) {
      drawingLine.remove()
      return
    }
    const obj = {
      source: tempSourceData,
      target: tempTargetData,
      path: drawingLine.attr('d'),
      pathIndex: abc.length,
    }
    links.push(obj)
    drawingLine.data([obj])
    drawingLine.attr(
      'class',
      tempSourceData.source.name + tempTargetData.source.name + abc.length
    )

    drawingLine.attr('d', (e) => {
      return renderPath({
        source: tempSourceData,
        target: tempTargetData,
      })
    })
    drawingLine = null
  }
}

function renderPath(points) {
  const { source, target } = points
  const { width: nodeWidth, height: nodeHeight } = source.source
  const averagePixel = 15
  let sourcePoints = updatePoints(points, 'source', target, averagePixel)
  let path = `M${source.x},${source.y}`

  if (target.position) {
    sourcePoints.pop()
    sourcePoints = uniq(sourcePoints)

    const targetPoints = updatePoints(
      points,
      'target',
      { x: source.x, y: source.y },
      averagePixel
    )

    const { position: sourcePosition } = tempSourceData
    const { position: targetPosition } = target
    const leftToRight = sourcePosition === 'right' && targetPosition === 'left'
    const rightToLeft = sourcePosition === 'left' && targetPosition === 'right'
    const topToBottom = sourcePosition === 'top' && targetPosition === 'bottom'
    const bottomToTop = sourcePosition === 'bottom' && targetPosition === 'top'
    const firstPoint = sourcePoints[0]
    const { x, y } = firstPoint
    const { x: ex, y: ey } = target
    const xrvs = ex - x < 0 ? -1 : 1
    const yrvs = ey - y < 0 ? -1 : 1
    const w = Math.abs(ex - x) / 2
    const h = Math.abs(ey - y) / 2

    // lineGenerator(targetPoints)

    console.log(xrvs, yrvs)
    if (leftToRight || rightToLeft) {
    }

    if (topToBottom || bottomToTop) {
      console.log('TB')
      // lineGenerator.curve(curveStepAfter)
    }

    console.log(sourcePoints)
    // path = `M${points.source.x},${points.source.y}`
    const myline = lineGenerator(targetPoints)
    // path += myline.replace('M', 'L')

    linkG
      .append('path')
      .attr('d', () => {
        return `M${target.x},${target.y}${myline.replace('M', 'L')}`
      })
      .attr('fill', 'none')
      .attr('stroke', 'green')
      .attr('stroke-width', '3px')
    lineGenerator.curve(curveStep)
  } else {
    path = `M${points.source.x},${points.source.y}`
    const myline = lineGenerator(sourcePoints)
    path += myline.replace('M', 'L')
    lineGenerator.curve(curveStep)
  }
  return path
}

function updatePoints(points, direction, targetPoints, averagePixel) {
  const { width: nodeWidth, height: nodeHeight } = points.source.source

  let centerPoints = [
    { x: points.source.x, y: points.source.y },
    { x: targetPoints.x, y: targetPoints.y },
  ]
  const { position } = points[direction]

  const params = {
    points,
    targetPoints,
    direction,
    nodeWidth,
    nodeHeight,
    averagePixel,
  }

  switch (position) {
    case 'top':
      centerPoints = updateTopPoints(params)
      break
    case 'bottom':
      centerPoints = updateBottomPoints(params)
      break
    case 'left':
      centerPoints = updateLeftPoints(params)
      break
    case 'right':
      centerPoints = updateRightPoints(params)
      break
    default:
      throw new Error('Invalid position')
  }

  return centerPoints
}

function updateTopPoints({
  points,
  targetPoints,
  direction,
  nodeWidth,
  nodeHeight,
  averagePixel,
}) {
  const { x, y } = points[direction]

  let curveType = curveStepAfter

  const deltaY = targetPoints.y - points[direction].y
  const deltaX = targetPoints.x - points[direction].x

  const firstPoint = { x, y }
  const secondPoint = { x, y }
  const thirdPoint = { x, y: targetPoints.y + Math.abs(deltaY) / 2 }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    curveType = curveStepBefore
  }

  // if line near to rect
  if (deltaY > -5) {
    curveType = curveStepBefore

    firstPoint.y = points[direction].y - averagePixel
    secondPoint.y = firstPoint.y
    thirdPoint.y = firstPoint.y

    if (Math.abs(deltaX) < nodeHeight / 2 + averagePixel) {
      if (deltaX < 0) {
        thirdPoint.x = points[direction].x - nodeHeight / 2 - averagePixel
      } else {
        thirdPoint.x = points[direction].x + nodeHeight / 2 + averagePixel
      }
    }

    if (Math.abs(deltaX) > nodeWidth / 2 + averagePixel) {
      secondPoint.x = points[direction].x
      thirdPoint.x = targetPoints.x - deltaX / 2
    }

    if (Math.abs(deltaY) > nodeHeight / 2 + averagePixel) {
      curveType = curveStepAfter
      thirdPoint.y = targetPoints.y - deltaY / 2
    }
  }

  lineGenerator.curve(curveType)

  return [
    { x: firstPoint.x, y: firstPoint.y },
    { x: secondPoint.x, y: secondPoint.y },
    { x: thirdPoint.x, y: thirdPoint.y },
    { x: targetPoints.x, y: targetPoints.y },
  ]
}

function updateBottomPoints({
  points,
  targetPoints,
  direction,
  nodeWidth,
  nodeHeight,
  averagePixel,
}) {
  const { x, y } = points[direction]

  let curveType = curveStepAfter

  const deltaY = targetPoints.y - points[direction].y
  const deltaX = targetPoints.x - points[direction].x

  const firstPoint = { x, y }
  const secondPoint = { x, y }
  const thirdPoint = { x, y: targetPoints.y - Math.abs(deltaY) / 2 }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    curveType = curveStepBefore
  }

  // if line near to rect
  if (deltaY < 5) {
    curveType = curveStepBefore

    firstPoint.y = points[direction].y + averagePixel
    secondPoint.y = firstPoint.y
    thirdPoint.y = firstPoint.y

    if (Math.abs(deltaX) < nodeHeight / 2 + averagePixel) {
      if (deltaX < 0) {
        thirdPoint.x = points[direction].x - nodeHeight / 2 - averagePixel
      } else {
        thirdPoint.x = points[direction].x + nodeHeight / 2 + averagePixel
      }
    }

    if (Math.abs(deltaX) > nodeWidth / 2 + averagePixel) {
      secondPoint.x = points[direction].x
      thirdPoint.x = targetPoints.x - deltaX / 2
    }

    if (Math.abs(deltaY) > nodeHeight / 2 + averagePixel) {
      curveType = curveStepAfter
      thirdPoint.y = targetPoints.y - deltaY / 2
    }
  }

  lineGenerator.curve(curveType)

  return [
    { x: firstPoint.x, y: firstPoint.y },
    { x: secondPoint.x, y: secondPoint.y },
    { x: thirdPoint.x, y: thirdPoint.y },
    { x: targetPoints.x, y: targetPoints.y },
  ]
}

function updateLeftPoints({
  points,
  targetPoints,
  direction,
  nodeWidth,
  nodeHeight,
  averagePixel,
}) {
  const { x, y } = points[direction]

  let curveType = curveStep
  const deltaX = targetPoints.x - points[direction].x
  const deltaY = targetPoints.y - points[direction].y

  const firstPoint = { x, y }
  const secondPoint = { x: targetPoints.x, y }
  const thirdPoint = { x, y }

  // if line near to rect
  if (deltaX > -5) {
    firstPoint.x = points[direction].x - averagePixel
    secondPoint.x = firstPoint.x
    secondPoint.y = targetPoints.y
    thirdPoint.x = secondPoint.x
    thirdPoint.y = secondPoint.y

    if (Math.abs(deltaY) < nodeHeight / 2 + averagePixel) {
      if (deltaY > 0) {
        thirdPoint.y = points[direction].y + nodeHeight / 2 + averagePixel
      } else {
        thirdPoint.y = points[direction].y - nodeHeight / 2 - averagePixel
      }
    }
    curveType = curveStepAfter

    if (Math.abs(deltaY) > nodeHeight + averagePixel) {
      secondPoint.y = points[direction].y
      thirdPoint.y = targetPoints.y - deltaY / 2
    }
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    curveType = curveStep
  } else {
    curveType = curveStepAfter
  }

  lineGenerator.curve(curveType)

  return [
    { x: firstPoint.x, y: firstPoint.y },
    { x: secondPoint.x, y: secondPoint.y },
    { x: thirdPoint.x, y: thirdPoint.y },
    { x: targetPoints.x, y: targetPoints.y },
  ]
}

function updateRightPoints({
  points,
  targetPoints,
  direction,
  nodeWidth,
  nodeHeight,
  averagePixel,
}) {
  const { x, y } = points[direction]

  let curveType = curveStep

  const firstPoint = { x, y }
  const secondPoint = { x: targetPoints.x, y }
  const thirdPoint = { x, y }

  const deltaX = targetPoints.x - points[direction].x
  const deltaY = targetPoints.y - points[direction].y

  // if line near to rect
  if (deltaX < 5) {
    firstPoint.x = points[direction].x + averagePixel
    secondPoint.x = firstPoint.x
    secondPoint.y = targetPoints.y
    thirdPoint.x = secondPoint.x
    thirdPoint.y = secondPoint.y

    if (Math.abs(deltaY) < nodeHeight / 2 + averagePixel) {
      if (deltaY > 0) {
        thirdPoint.y = points[direction].y + nodeHeight / 2 + averagePixel
      } else {
        thirdPoint.y = points[direction].y - nodeHeight / 2 - averagePixel
      }
    }
    curveType = curveStepAfter

    if (Math.abs(deltaY) > nodeHeight + averagePixel) {
      secondPoint.y = points[direction].y
      thirdPoint.y = targetPoints.y - deltaY / 2
    }
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    curveType = curveStep
  } else {
    curveType = curveStepAfter
  }

  lineGenerator.curve(curveType)

  return [
    { x: firstPoint.x, y: firstPoint.y },
    { x: secondPoint.x, y: secondPoint.y },
    { x: thirdPoint.x, y: thirdPoint.y },
    { x: targetPoints.x, y: targetPoints.y },
  ]
}

function create4Points(e) {
  const dotPointsData = new Array(4)
  for (let i = 0; i < dotPointsData.length; i++) {
    let singlePoint = {
      x: 0,
      y: 0,
      source: e,
      position: 'top',
    }
    singlePoint = updateSinglePoints(e, i)
    dotPointsData[i] = singlePoint
  }
  return dotPointsData
}

function updateSinglePoints(node, index) {
  const { x, y, width, height } = node
  const singlePoint = {
    x: 0,
    y: 0,
    source: node,
    position: 'top',
  }

  switch (index) {
    case 0:
      singlePoint.x = x + width / 2
      singlePoint.y = y
      singlePoint.position = 'top'
      break
    case 1:
      singlePoint.x = x + width / 2
      singlePoint.y = y + height
      singlePoint.position = 'bottom'
      break
    case 2:
      singlePoint.x = x + width
      singlePoint.y = y + height / 2
      singlePoint.position = 'right'
      break
    case 3:
      singlePoint.x = x
      singlePoint.y = y + height / 2
      singlePoint.position = 'left'
      break
    default:
      throw new Error('Invalid index')
  }

  return singlePoint
}

export default function render() {
  const selectParent = nodeG
    .selectAll('g.parentG')
    .data(nodes)
    .join('g')
    .attr('id', (d) => `parentG - ${d.name} `)
    .attr('class', 'parentG')
    .attr('fill', 'black')

  selectParent.call(renderNodes, nodes).call(renderPoints, nodes)
}
