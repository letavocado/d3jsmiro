import {
  select,
  drag,
  curveStepAfter,
  link,
  line,
  curveStep,
  pointer,
  curveStepBefore,
} from 'd3'

class Nodes {
  drawSourceNode

  drawTargetNode

  tempSourceData

  tempTargetData

  lineItem

  nodeG = null

  isDrawLink = false

  lineGenerator = line()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveStep)

  constructor(element, nodes) {
    this.element = element
    this.nodes = nodes

    this.render()
  }

  render() {
    this.nodeG = this.element.append('g').attr('id', 'nodeG')
    const selectParent = this.nodeG
      .selectAll('g.parentG')
      .data(this.nodes)
      .join('g')
      .attr('class', 'parentG')

    selectParent.call(this.#renderNodes.bind(this))
    selectParent.call(this.#renderPoints.bind(this))
  }

  // Initialize the nodes
  // eslint-disable-next-line class-methods-use-this
  #renderNodes(selection) {
    selection
      .selectAll('rect.nodeRect')
      .data((e) => [e])
      .join('rect')
      .attr('class', 'nodeRect')
      .attr('x', (d) => d.x + d.width / 2)
      .attr('y', (d) => d.y + d.height / 2)
      .style('fill', 'white')
      .style('stroke', '#56445D')
      .style('stroke-width', '2px')
      .call(this.dragCallback.bind(this))
      .transition()
      .duration(300)
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
  }

  dragCallback() {
    drag().on('drag', this.dragged.bind(this))
  }

  dragged(e, d) {
    console.log('sldjfl')
    d.x += e.dx
    d.y += e.dy

    const node = select(this)
    node.attr('x', d.x).attr('y', d.y)
    console.log('st')
    const linke = link(curveStepAfter)
      .x((d) => {
        console.log(`this: ${d}`)
        console.log('ksdj')
      })
      .y((d) => d.y)
      .source(() => [3, 4])
      .target(() => [5, 6])
    // console.log(linke)
    console.log('end')

    // linkG.selectAll('path').join('path').attr('d', linke)
    const nodeData = node.data()[0]
    // select(node.node().parentElement).call(dragCircles, nodeData)

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

  #renderPoints(selection) {
    selection
      .selectAll('circle.nodeCircle')
      .data((e) => this.create4Points(e))
      .join('circle')
      .attr('class', 'nodeCircle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', 0)
      .attr('fill', 'white')
      .attr('stroke', '#0000FF')
      // .attr('data-source', (e) => e)
      .on('mouseover', function () {
        select(this).classed('hover', true)
      })
      .on('mouseout', function () {
        select(this).classed('hover', false)
      })
      .on('mousedown', this.mousedown)
      .on('mouseup', this.mouseup)
      .transition()
      .duration(500)
      .attr('r', '4')

    // .on('mousedown', mousedown)
    // .on('mouseup', mouseup)
  }

  create4Points(e) {
    const dotPointsData = new Array(4)
    for (let i = 0; i < dotPointsData.length; i++) {
      let singlePoint = {
        x: 0,
        y: 0,
        source: e,
        position: 'top',
      }
      singlePoint = this.updateSinglePoints(e, i)
      dotPointsData[i] = singlePoint
    }
    return dotPointsData
  }

  updateSinglePoints(node, index) {
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

  mousedown(event) {
    const [x, y] = pointer(event, event.target)
    this.isDrawLink = true

    this.drawSourceNode = event
    const selectSource = select(event.target)
    selectSource.classed('linked', true)
    this.tempSourceData = selectSource.data()[0]

    // this.lineItem = linkG
    //   .append('path')
    //   .attr('d', () => {
    //     return renderPath({
    //       source: this.tempSourceData,
    //       target: { x, y },
    //     })
    //   })
    //   .attr('fill', 'none')
    //   .attr('stroke', '#ffd02f')
    //   .attr('stroke-width', '3px')
  }

  mousemove(event) {
    if (this.isDrawLink) {
      const [x, y] = pointer(event, event.target)
      this.lineItem.attr('d', () => {
        return this.renderPath({
          source: this.tempSourceData,
          target: { x, y },
        })
      })
    }
  }

  mouseup(event) {
    if (this.isDrawLink) {
      const selectTarget = select(event.target)
      selectTarget.classed('linked', true)
      this.tempTargetData = selectTarget.data()[0]
      console.log(event)
      this.isDrawLink = false
      const pathIndex = 0
      // const abc = links.filter(
      //   (e) =>
      //     e.source.source.name === this.tempSourceData.source.name &&
      //     e.target.source.name === this.tempTargetData.source.name
      // )
      // const samePoints = links.filter(
      //   (e) =>
      //     e.source.source.name === this.tempSourceData.source.name &&
      //     e.source.position === this.tempSourceData.position &&
      //     e.target.source.name === this.tempTargetData.source.name &&
      //     e.source.position === this.tempTargetData.position
      // )
      // if (samePoints.length) {
      //   this.lineItem.remove()
      //   return
      // }
      // const obj = {
      //   source: this.tempSourceData,
      //   target: this.tempTargetData,
      //   path: this.lineItem.attr('d'),
      //   pathIndex: abc.length,
      // }
      // links.push(obj)
      // this.lineItem.data([obj])
      // this.lineItem.attr(
      //   'class',
      //   this.tempSourceData.source.name + this.tempTargetData.source.name + abc.length
      // )

      // this.lineItem.attr('d', (e) => {
      //   const obj = {
      //     source: this.tempSourceData,
      //     target: this.tempTargetData,
      //   }
      //   return this.renderPath(obj)
      // })
      // this.lineItem = null
    }
  }

  renderPath(points) {
    const { source, target } = points
    const { width: nodeWidth, height: nodeHeight } = source.source
    const averagePixel = 10

    let sourcePoints = this.updatePoints(points, 'source', target, averagePixel)
    let path = `M${source.x},${source.y}`

    if (target.position) {
      sourcePoints.pop()
      sourcePoints = sourcePoints.filter(
        (v, i, a) => a.findIndex((val) => v.x === val.x && v.y === val.y) === i
      )
      let targetPoints = this.updatePoints(
        points,
        'target',
        sourcePoints[sourcePoints.length - 1],
        averagePixel
      )
      targetPoints = targetPoints.filter(
        (v, i, a) => a.findIndex((val) => v.x === val.x && v.y === val.y) === i
      )
      targetPoints.reverse()
      const firstPoint = sourcePoints[0]
      const lastPoints = targetPoints[targetPoints.length - 1]
      const { x } = firstPoint
      const { y } = firstPoint
      const ex = lastPoints.x
      const ey = lastPoints.y
      const xrvs = ex - x < 0 ? -1 : 1
      const yrvs = ey - y < 0 ? -1 : 1
      const h = Math.abs(ey - y) / 2
      const w = Math.abs(ex - x) / 2
      if (targetPoints.length >= 3 || sourcePoints.length >= 3) {
        if (
          (target.position == 'left' && source.position == 'right') ||
          (target.position == 'right' && source.position == 'left')
        ) {
          if (h >= nodeHeight / 2 + averagePixel) {
            if (sourcePoints.length >= 2) {
              sourcePoints[sourcePoints.length - 1].x = x
              sourcePoints[sourcePoints.length - 1].y = y + h * yrvs
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
            sourcePoints[sourcePoints.length - 1].x = sourcePoints[0].x
            if (sourcePoints.length >= 2) {
              sourcePoints[sourcePoints.length - 1].y = sourcePoints[1].y
            }
            targetPoints[0].x = x + w * xrvs
            this.lineGenerator.curve(curveStepBefore)
            targetPoints[1].x =
              targetPoints.length == 3
                ? targetPoints[targetPoints.length - 1].x
                : x + w * xrvs
          }
        }
        if (
          (target.position == 'bottom' && source.position == 'top') ||
          (target.position == 'top' && source.position == 'bottom')
        ) {
          if (w >= nodeWidth / 2 + averagePixel) {
            if (sourcePoints.length >= 2) {
              sourcePoints[sourcePoints.length - 1].x = x + w * xrvs
              sourcePoints[sourcePoints.length - 1].y = y
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
            sourcePoints[sourcePoints.length - 1].y = sourcePoints[0].y
            if (sourcePoints.length >= 2) {
              sourcePoints[sourcePoints.length - 1].x = sourcePoints[1].x
            }
            targetPoints[0].y = y + h * yrvs
            if (targetPoints.length >= 2) {
              targetPoints[1].y = y + h * yrvs
            }
          }
        }
      }
      path += this.lineGenerator(sourcePoints).replace('M', 'L')
      const lastPath = this.lineGenerator(targetPoints).replace('M', 'L')
      path += lastPath
      this.lineGenerator.curve(curveStep)
      path += `L${target.x},${target.y}`
    } else {
      path = `M${source.x},${source.y}`
      const myline = this.lineGenerator(sourcePoints)
      path += myline.replace('M', 'L')
      this.lineGenerator.curve(curveStep)
    }
    return path
  }

  updatePoints(points, direction, targetPoints, averagePixel) {
    const { width: nodeWidth, height: nodeHeight } = points.source.source
    const { position, x, y, source } = points[direction]

    const firstPoint = { x, y }
    const secondPoint = { x, y }
    const thirdPoint = { x, y }
    const centerPoints = []

    console.log(position)

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
          firstPoint.y -= averagePixel
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
          this.lineGenerator.curve(curveStepBefore)
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
          this.lineGenerator.curve(curveStep)
        }
        break

      case 'bottom':
        firstPoint.y += averagePixel
        // bottom side to btop
        if (y <= targetPoints.y && targetPoints.y <= firstPoint.y) {
          if (
            firstPoint.x - nodeWidth / 2 <= targetPoints.x &&
            targetPoints.x <= firstPoint.x + nodeWidth / 2 + averagePixel
          ) {
            firstPoint.y = targetPoints.y
          }
        } else {
          firstPoint.y += averagePixel
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
          this.lineGenerator.curve(curveStepBefore)
        } else {
          secondPoint.x = firstPoint.x
          secondPoint.y = firstPoint.y
          thirdPoint.x = secondPoint.x
          thirdPoint.y = secondPoint.y
          this.lineGenerator.curve(curveStep)
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
          firstPoint.x += averagePixel
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
        console.log('sec', secondPoint)
        break

      case 'left':
        firstPoint.x -= averagePixel

        if (x >= targetPoints.x && targetPoints.x >= firstPoint.x) {
          if (
            firstPoint.y - nodeHeight / 2 <= targetPoints.y &&
            targetPoints.y <= firstPoint.y + nodeHeight / 2 + averagePixel
          ) {
            firstPoint.x = targetPoints.x
          }
        } else {
          firstPoint.x -= averagePixel
        }
        if (x <= targetPoints.x) {
          if (targetPoints.y <= y) {
            // Left
            secondPoint.x = source.pointX - averagePixel
            secondPoint.y = source.pointY - averagePixel
          } else {
            // Right
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
        throw Error('Invalid direction')
    }

    centerPoints.push({ x: firstPoint.x, y: firstPoint.y })
    centerPoints.push({ x: secondPoint.x, y: secondPoint.y })
    centerPoints.push({ x: thirdPoint.x, y: thirdPoint.y })
    centerPoints.push({ x: targetPoints.x, y: targetPoints.y })

    console.warn('skdjf')
    console.log(...centerPoints)
    return centerPoints
  }
}

export default Nodes
