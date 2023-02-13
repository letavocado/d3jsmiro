import * as d3 from 'd3'
import './style.scss'

import { uniq } from './utils'

const width = +window.innerWidth
const height = +window.innerHeight

const nodeHeight = 100
const nodeWidth = 100

let drawSourceNode
let drawTargeteNode
let tempSourceData
let tempTargetData

const data = {
  nodes: [
    {
      name: 'A',
      pointX: 200,
      pointY: 100,
    },
    {
      name: 'B',
      pointX: 800,
      pointY: 100,
    },
    {
      name: 'C',
      pointX: 200,
      pointY: 500,
    },
    {
      name: 'D',
      pointX: 800,
      pointY: 500,
    },
  ],
  links: [],
}
let isDrawLink = false
let drawingLine
const mousedownNode = null

const svg = d3
  .select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .on('mousemove', mousemove)
  .on('mouseup', (e) => {
    nodeG.classed('drawing', false)
    console.log('1')

    if (e.target.tagName !== 'circle') {
      isDrawLink = false
      if (drawingLine) {
        drawingLine.remove()
      }
    }
  })

const linkG = svg.append('g').attr('class', 'linkG')
const nodeG = svg.append('g').attr('id', 'nodeG')

const lineGenerator = d3
  .line()
  .x(function (d) {
    return d.x
  })
  .y(function (d) {
    return d.y
  })
  .curve(d3.curveStep)

function mousemove(event) {
  const target = d3.pointer(event)

  textItem.text(`x: ${target[0]}, y: ${target[1]}`)

  if (isDrawLink) {
    const source = d3.pointer(drawSourceNode, drawSourceNode.target)

    nodeG.classed('drawing', true)
    const [x, y] = d3.pointer(event)
    const data = d3.select(event.target).data()[0]

    let target = {
      x,
      y,
    }

    const {
      source: { name: sourceName },
    } = tempSourceData

    const isSameNode = sourceName === data?.source?.name
    console.log(data)
    if (data?.position && !isSameNode) {
      target = data
    }

    drawingLine.attr('d', () =>
      renderPath({
        source: tempSourceData,
        target,
      })
    )
  }
}

const dragNodes = d3.drag().on('drag', dragged)

function dragged(e, d) {
  d.pointX += e.dx
  d.pointY += e.dy

  const node = d3.select(this).attr('x', d.pointX).attr('y', d.pointY)
  const nodeData = node.data()[0]

  d3.select(node.node().parentElement)
    .selectAll('g.circleG')
    .each(function (e, i) {
      const updatedData = updateSinglePoints(nodeData, i)
      d3.select(this)
        .data([updatedData])
        .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      d3.select(this.firstChild).data([updatedData])
      d3.select(this.firstChild.nextElementSibling).data([updatedData])
    })

  data.links.forEach((e, i) => {
    const sourceName = e.source.source.name
    const targetName = e.target.source.name
    const sourcePosition = e.source.position
    const targetPosition = e.target.position

    if (sourceName === nodeData.name || targetName === nodeData.name) {
      if (sourceName === nodeData.name) {
        const index = getPositionIndex(sourcePosition)
        data.links[i].source = updateSinglePoints(nodeData, index)
      } else {
        const index = getPositionIndex(targetPosition)
        data.links[i].target = updateSinglePoints(nodeData, index)
      }
    }
  })

  const filterData = data.links.filter(
    (e) =>
      e.source.source.name === nodeData.name ||
      e.target.source.name === nodeData.name
  )

  filterData.forEach((e) => {
    const className = e.source.source.name + e.target.source.name + e.pathIndex
    linkG.select(`path.${className}`).attr('d', renderPath)
  })
}

function getPositionIndex(position) {
  switch (position) {
    case 'top':
      return 0
    case 'bottom':
      return 1
    case 'right':
      return 2
    case 'left':
      return 3
    default:
      throw Error(`Invalid position ${position}`)
  }
}

nodeG
  .selectAll('g.parentG')
  .data(data.nodes)
  .join('g')
  .attr('id', (d) => `parentG-${d.name}`)
  .attr('class', 'parentG')
  .call(renderNodes)
  .call(renderCircles)

const textItem = svg
  .append('text')
  .attr('x', 0)
  .attr('y', 0)
  .attr('dy', '.75em')
  .attr('pointer-events', 'none')
  .text('0 : 0')

function renderNodes(selection) {
  selection
    .selectAll('rect.nodeRect')
    .data((e) => [e])
    .join('rect')
    .attr('class', 'nodeRect')
    .attr('x', (d) => d.pointX + nodeWidth / 2)
    .attr('y', (d) => d.pointY + nodeHeight / 2)
    .style('fill', 'transparent')
    .style('stroke', '#56445D')
    .style('stroke-width', '2px')
    .call(dragNodes)
    .transition()
    .duration(300)
    .attr('width', nodeWidth)
    .attr('height', nodeHeight)
    .attr('x', (d) => d.pointX)
    .attr('y', (d) => d.pointY)
}

function renderCircles(selection) {
  const circleG = selection
    .selectAll('g.circleG')
    .data((e) => create4Points(e))
    .join('g')
    .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
    .attr('class', 'circleG')

  circleG
    .append('circle')
    .attr('r', 20)
    .attr('fill', 'transparent')
    .attr('data-type', 'point')
    .attr('class', 'circleWrap')
    .on('mouseup', mouseup)

  circleG
    .append('circle')
    .attr('class', 'nodeCircle')
    .attr('r', 0)
    .attr('fill', 'white')
    .attr('stroke', '#0000FF')
    .on('mousedown', mousedown)
    .on('mouseup', mouseup)
    .transition()
    .duration(500)
    .attr('r', '4')
}

function mousedown(event) {
  isDrawLink = true
  drawSourceNode = event
  tempSourceData = d3.select(event.target).data()[0]
  const [x, y] = d3.pointer(event, svg)

  drawingLine = linkG
    .append('path')
    .attr('d', () =>
      renderPath({
        source: tempSourceData,
        target: { x, y },
      })
    )
    .attr('fill', 'none')
    .attr('stroke', '#ffd02f')
    .attr('stroke-width', '3px')
  // .mousedown
}

function mouseup(event) {
  if (isDrawLink) {
    tempTargetData = d3.select(event.target).data()[0]
    isDrawLink = false
    const commonLinksOfNodes = data.links.filter((e) => {
      return (
        e.source.source.name === tempSourceData.source.name &&
        e.target.source.name === tempTargetData.source.name
      )
    })
    const samePoints = tempSourceData.source.name === tempTargetData.source.name
    if (samePoints) {
      drawingLine.remove()
      return
    }

    const obj = {
      source: tempSourceData,
      target: tempTargetData,
      path: drawingLine.attr('d'),
      pathIndex: commonLinksOfNodes.length,
    }
    const className =
      tempSourceData.source.name +
      tempTargetData.source.name +
      commonLinksOfNodes.length

    data.links.push(obj)
    drawingLine.data([obj])
    drawingLine.attr('class', 'linkPath')
    drawingLine.attr('class', `linkPath ${className}`)

    drawingLine.attr('d', () =>
      renderPath({
        source: tempSourceData,
        target: tempTargetData,
      })
    )

    drawingLine = null
  }
}

function create4Points(e) {
  const dotPointsData = new Array(4)
  for (let i = 0; i < dotPointsData.length; i++) {
    let singlePoint = { x: 0, y: 0, source: e, position: 'top' }
    singlePoint = updateSinglePoints(e, i)
    dotPointsData[i] = singlePoint
  }
  return dotPointsData
}

function updatePoints(points, direction, targetPoints, averagePixel) {
  const { x, y, source, position } = points[direction]
  const firstPoint = { x, y }
  const secondPoint = { x, y }
  const thirdPoint = { x: secondPoint.x, y: secondPoint.y }

  switch (position) {
    case 'top':
      firstPoint.y -= averagePixel

      // top side to bottom
      if (y >= targetPoints.y && targetPoints.y >= firstPoint.y) {
        if (
          firstPoint.x - nodeWidth / 2 <= targetPoints.x &&
          targetPoints.x <= firstPoint.x + nodeWidth / 2 + averagePixel
        ) {
          firstPoint.y = targetPoints.y
        }
      } else {
        firstPoint.y = y - averagePixel
      }

      // bottom side
      if (y <= targetPoints.y) {
        if (targetPoints.x <= x) {
          // top left
          secondPoint.x = source.pointX - averagePixel
          secondPoint.y = source.pointY - averagePixel
        } else {
          // top right
          secondPoint.x = source.pointX + nodeWidth + averagePixel
          secondPoint.y = source.pointY - averagePixel
        }
        lineGenerator.curve(d3.curveStepBefore)
        if (
          firstPoint.x - nodeWidth / 2 <= targetPoints.x &&
          targetPoints.x <= firstPoint.x + nodeWidth / 2 + averagePixel &&
          source.pointY + nodeHeight + averagePixel <= targetPoints.y
        ) {
          thirdPoint.x = secondPoint.x
          thirdPoint.y = source.pointY + nodeHeight + averagePixel
        } else {
          thirdPoint.x = secondPoint.x
          thirdPoint.y = secondPoint.y
        }
      } else {
        secondPoint.x = firstPoint.x
        secondPoint.y = firstPoint.y
        thirdPoint.x = secondPoint.x
        thirdPoint.y = secondPoint.y
        lineGenerator.curve(d3.curveStep)
      }
      break

    case 'bottom':
      firstPoint.y += averagePixel
      // bottom side to top
      if (y <= targetPoints.y && targetPoints.y <= firstPoint.y) {
        if (
          firstPoint.x - nodeWidth / 2 <= targetPoints.x &&
          targetPoints.x <= firstPoint.x + nodeWidth / 2 + averagePixel
        ) {
          firstPoint.y = targetPoints.y
        }
      } else {
        firstPoint.y = y + averagePixel
      }
      // top side
      if (y >= targetPoints.y) {
        if (targetPoints.x <= x) {
          // left
          secondPoint.x = source.pointX - averagePixel
          secondPoint.y = source.pointY + nodeHeight + averagePixel
        } else {
          // right
          secondPoint.x = source.pointX + nodeWidth + averagePixel
          secondPoint.y = source.pointY + nodeHeight + averagePixel
        }
        if (
          firstPoint.x - nodeWidth / 2 <= targetPoints.x &&
          targetPoints.x <= firstPoint.x + nodeWidth / 2 + averagePixel &&
          source.pointY - averagePixel >= targetPoints.y
        ) {
          thirdPoint.x = secondPoint.x
          thirdPoint.y = source.pointY - averagePixel
        } else {
          thirdPoint.x = secondPoint.x
          thirdPoint.y = secondPoint.y
        }
        lineGenerator.curve(d3.curveStepBefore)
      } else {
        secondPoint.x = firstPoint.x
        secondPoint.y = firstPoint.y
        thirdPoint.x = secondPoint.x
        thirdPoint.y = secondPoint.y
        lineGenerator.curve(d3.curveStep)
      }
      break

    case 'right':
      firstPoint.x += averagePixel
      // top side to bottom
      if (x <= targetPoints.x && targetPoints.x <= firstPoint.x) {
        if (
          firstPoint.y - nodeHeight / 2 <= targetPoints.y &&
          targetPoints.y <= firstPoint.y + nodeHeight / 2 + averagePixel
        ) {
          firstPoint.x = targetPoints.x
        }
      } else {
        firstPoint.x = x + averagePixel
      }
      if (x >= targetPoints.x) {
        if (targetPoints.y <= y) {
          // top right
          secondPoint.x = source.pointX + nodeWidth + averagePixel
          secondPoint.y = source.pointY - averagePixel
        } else {
          // bottom right
          secondPoint.x = source.pointX + nodeWidth + averagePixel
          secondPoint.y = source.pointY + nodeHeight + averagePixel
        }
        if (
          firstPoint.y - nodeHeight / 2 <= targetPoints.y &&
          targetPoints.y <= firstPoint.y + nodeHeight / 2 + averagePixel &&
          source.pointX - averagePixel >= targetPoints.x
        ) {
          thirdPoint.x = source.pointX - averagePixel
          thirdPoint.y = secondPoint.y
        } else {
          thirdPoint.x = secondPoint.x
          thirdPoint.y = secondPoint.y
        }
      } else {
        secondPoint.x = firstPoint.x
        secondPoint.y = firstPoint.y
        thirdPoint.x = secondPoint.x
        thirdPoint.y = secondPoint.y
      }
      break

    case 'left':
      firstPoint.x = x - averagePixel
      firstPoint.y = y
      if (x >= targetPoints.x && targetPoints.x >= firstPoint.x) {
        if (
          firstPoint.y - nodeHeight / 2 <= targetPoints.y &&
          targetPoints.y <= firstPoint.y + nodeHeight / 2 + averagePixel
        ) {
          firstPoint.x = targetPoints.x
        }
      } else {
        firstPoint.x = x - averagePixel
      }
      if (x <= targetPoints.x) {
        if (targetPoints.y <= y) {
          // left
          secondPoint.x = source.pointX - averagePixel
          secondPoint.y = source.pointY - averagePixel
        } else {
          // right
          secondPoint.x = source.pointX - averagePixel
          secondPoint.y = source.pointY + nodeHeight + averagePixel
        }
        if (
          firstPoint.y - nodeHeight / 2 <= targetPoints.y &&
          targetPoints.y <= firstPoint.y + nodeHeight / 2 + averagePixel &&
          source.pointX + nodeWidth + averagePixel <= targetPoints.x
        ) {
          thirdPoint.x = source.pointX + nodeWidth + averagePixel
          thirdPoint.y = secondPoint.y
        } else {
          thirdPoint.x = secondPoint.x
          thirdPoint.y = secondPoint.y
        }
      } else {
        secondPoint.x = firstPoint.x
        secondPoint.y = firstPoint.y
        thirdPoint.x = secondPoint.x
        thirdPoint.y = secondPoint.y
      }
      break
    default:
      throw Error('Invalid position')
  }

  return [
    { x: firstPoint.x, y: firstPoint.y },
    { x: secondPoint.x, y: secondPoint.y },
    { x: thirdPoint.x, y: thirdPoint.y },
    { x: targetPoints.x, y: targetPoints.y },
  ]
}

function renderPath(points) {
  const { source, target } = points
  const { position: sourcePosition } = source
  const { position: targetPosition } = target
  const averagePixel = 15
  let sourcePoints = updatePoints(points, 'source', points.target, averagePixel)
  let path = `M${points.source.x},${points.source.y}`

  if (target.position) {
    sourcePoints.pop()
    sourcePoints = uniq(sourcePoints)

    let targetPoints = updatePoints(
      points,
      'target',
      sourcePoints.at(-1),
      averagePixel
    )
    targetPoints = uniq(targetPoints)
    targetPoints.reverse()

    const firstPoint = sourcePoints[0]
    const lastPoints = targetPoints.at(-1)
    const { x, y } = firstPoint
    const { x: ex, y: ey } = lastPoints
    const xrvs = ex - x < 0 ? -1 : 1
    const yrvs = ey - y < 0 ? -1 : 1
    const h = Math.abs(ey - y) / 2
    const w = Math.abs(ex - x) / 2

    const leftToRight = sourcePosition === 'left' && targetPosition === 'right'
    const rightToLeft = sourcePosition === 'right' && targetPosition === 'left'
    const topToBottom = sourcePosition === 'top' && targetPosition === 'bottom'
    const bottomToTop = sourcePosition === 'bottom' && targetPosition === 'top'

    if (targetPoints.length >= 3 || sourcePoints.length >= 3) {
      if (leftToRight || rightToLeft) {
        if (h >= nodeHeight / 2 + averagePixel) {
          if (sourcePoints.length >= 2) {
            sourcePoints.at(-1).x = x
            sourcePoints.at(-1).y = y + h * yrvs
            targetPoints[0].x = x
            targetPoints[0].y = y + h * yrvs
          } else {
            sourcePoints.push({ x, y: y + h * yrvs })
            targetPoints[0] = { x, y: y + h * yrvs }
          }

          if (targetPoints.length >= 2) {
            targetPoints[1].y = y + h * yrvs
          }
        } else if (w >= nodeWidth + averagePixel * 2) {
          sourcePoints.at(-1).x = sourcePoints[0].x

          if (sourcePoints.length >= 2) {
            sourcePoints.at(-1).y = sourcePoints[1].y
          }

          targetPoints[0].x = x + w * xrvs
          lineGenerator.curve(d3.curveStepBefore)
          targetPoints[1].x =
            targetPoints.length === 3 ? targetPoints.at(-1).x : x + w * xrvs
        }
      }

      if (topToBottom || bottomToTop) {
        if (w >= nodeWidth / 2 + averagePixel) {
          if (sourcePoints.length >= 2) {
            sourcePoints.at(-1).x = x + w * xrvs
            sourcePoints.at(-1).y = y
            targetPoints[0].x = x + w * xrvs
            targetPoints[0].y = y
          } else {
            sourcePoints.push({ x: x + w * xrvs, y })
            targetPoints[0] = { x: x + w * xrvs, y }
          }

          if (targetPoints.length >= 2) {
            targetPoints[1].x = x + w * xrvs
          }
        } else if (h >= nodeHeight + averagePixel * 2) {
          sourcePoints.at(-1).y = sourcePoints[0].y

          if (sourcePoints.length >= 2) {
            sourcePoints.at(-1).x = sourcePoints[1].x
          }

          targetPoints[0].y = y + h * yrvs

          if (targetPoints.length >= 2) {
            targetPoints[1].y = y + h * yrvs
          }
        }
      }
    }

    path += lineGenerator(sourcePoints).replace('M', 'L')
    const lastPath = lineGenerator(targetPoints).replace('M', 'L')
    path += lastPath
    lineGenerator.curve(d3.curveStep)
    path += `L${points.target.x},${points.target.y}`
  } else {
    path = `M${points.source.x},${points.source.y}`
    const newLine = lineGenerator(sourcePoints)
    path += newLine.replace('M', 'L')
    lineGenerator.curve(d3.curveStep)
  }

  return path
}

function updateSinglePoints(e, i) {
  const singlePoint = { x: 0, y: 0, source: e, position: 'top' }

  switch (i) {
    case 0:
      singlePoint.x = e.pointX + nodeWidth / 2
      singlePoint.y = e.pointY
      singlePoint.position = 'top'
      break
    case 1:
      singlePoint.x = e.pointX + nodeWidth / 2
      singlePoint.y = e.pointY + nodeHeight
      singlePoint.position = 'bottom'
      break
    case 2:
      singlePoint.x = e.pointX + nodeWidth
      singlePoint.y = e.pointY + nodeHeight / 2
      singlePoint.position = 'right'
      break
    case 3:
      singlePoint.x = e.pointX
      singlePoint.y = e.pointY + nodeHeight / 2
      singlePoint.position = 'left'
      break
    default:
      throw Error('Invalid index')
  }

  return singlePoint
}
