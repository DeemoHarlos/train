import { LinkedRail, Rail, RailLink } from '@/types'
import V from '@/vector'

const getRailLength = (rail: Rail) => {
  if (rail.type === 'curve') {
    let deltaTheta = (rail.endTheta - rail.startTheta) % (2 * Math.PI)
    if (deltaTheta < 0) deltaTheta += (2 * Math.PI)
    return rail.r * deltaTheta
  } else
    return rail.startPos.dist(rail.endPos)
}

const combineRails = (rails: Rail[], railLinks: RailLink[]) => {
  const linkedRails: LinkedRail[] = rails.map((rail, index) => ({
    ...rail,
    id: index,
    length: getRailLength(rail),
  }))
  railLinks.forEach(railLink => {
    const rail0 = linkedRails.find(r => r.id === railLink[0].id)
    const rail1 = linkedRails.find(r => r.id === railLink[1].id)
    if (!rail0 || !rail1) throw 'Rail Not Found'
    rail0[railLink[0].from] = { rail: rail1, to: railLink[1].from }
    rail1[railLink[1].from] = { rail: rail0, to: railLink[0].from }
  })
  return linkedRails
}

const rails: Rail[] = [
  { type: 'curve', c: new V(-100, 0), r: 100, startTheta: Math.PI / 2, endTheta: Math.PI * 3 / 2 },
  { type: 'curve', c: new V(100, 0), r: 100, startTheta: Math.PI * 3 / 2, endTheta: Math.PI / 2 },
  { type: 'straight', startPos: new V(100, 100), endPos: new V(-100, 100) },
  { type: 'straight', startPos: new V(-100, -100), endPos: new V(100, -100) },
]

const railLinks: RailLink[] = [
  [{ id: 0, from: 'start' }, { id: 2, from: 'end' }],
  [{ id: 2, from: 'start' }, { id: 1, from: 'end' }],
  [{ id: 1, from: 'start' }, { id: 3, from: 'end' }],
  [{ id: 3, from: 'start' }, { id: 0, from: 'end' }],
]

const linkedRails = combineRails(rails, railLinks)

const train = {
  length: 10,
  front: {
    rail: linkedRails.find(r => r.id === 2) as LinkedRail,
    pos: 180,
    dir: 1,
  },
  back: {
    rail: linkedRails.find(r => r.id === 2) as LinkedRail,
    pos: 170,
    dir: 1,
  },
}

const findBackPosOnRail = (
  front: { rail: LinkedRail, pos: number, dir: number},
  back: { rail: LinkedRail, pos: number, dir: number},
) => {
  const { rail, pos, dir } = back
  if (rail.type === 'curve') {
    // https://math.stackexchange.com/questions/256100
    const c1 = rail.c
    const c2 = getPos(front)
    const r1 = rail.r
    const r2 = train.length
    const R = c1.dist(c2)
    // console.log(c1.show(), c2.show(), r1, r2, R)
    const rrsum = (r1 * r1 + r2 * r2)
    const rrdif = (r1 * r1 - r2 * r2)
    const j = (2 * rrsum) / (R * R) - (rrdif * rrdif) / (R * R * R * R) - 1
    if (j < 0) throw 'Derailed!0'
    const sola = c1.add(c2)
    const solb = c2.sub(c1).scale(rrdif / (R * R))
    const solc = new V(c2.y - c1.y, c1.x - c2.x).scale(Math.sqrt(j))
    const sol1 = sola.add(solb).add(solc).scale(1 / 2)
    const sol2 = sola.add(solb).sub(solc).scale(1 / 2)
    const a1 = sol1.sub(rail.c).angle()
    const a2 = sol2.sub(rail.c).angle()
    const pos1 = (a1 - rail.startTheta + Math.PI * 2) % (Math.PI * 2) * rail.r
    const pos2 = (a2 - rail.startTheta + Math.PI * 2) % (Math.PI * 2) * rail.r
    const posdif1 = (pos1 - pos) / dir
    const posdif2 = (pos2 - pos) / dir
    if (Math.abs(posdif1) > Math.abs(posdif2))
      return pos2
    else
      return pos1
  } else {
    const f = getPos(front)
    const p1 = rail.startPos.sub(f)
    const p2 = rail.endPos.sub(f)
    const r = train.length
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dr = p1.dist(p2)
    const D = p1.x * p2.y - p2.x * p1.y
    const j = r * r * dr * dr - D * D
    if (j < 0) throw 'Derailed!'
    const m = p2.sub(p1).y / p2.sub(p1).x
    const norm = p2.sub(p1).norm()
    let pos1: number, pos2: number
    if (m < 1 && m > -1) { // mx + d = y
      const sgn = dy < 0 ? -1 : 1
      const sol1x = (D * dy + sgn * dx * Math.sqrt(j)) / (dr * dr)
      const sol2x = (D * dy - sgn * dx * Math.sqrt(j)) / (dr * dr)
      pos1 = (sol1x - p1.x) / norm.x
      pos2 = (sol2x - p1.x) / norm.x
    } else { // my + d = x
      const sol1y = (-D * dx + Math.abs(dy) * Math.sqrt(j)) / (dr * dr)
      const sol2y = (-D * dx - Math.abs(dy) * Math.sqrt(j)) / (dr * dr)
      pos1 = (sol1y - p1.y) / norm.y
      pos2 = (sol2y - p1.y) / norm.y
    }
    const posdif1 = (pos1 - pos) / dir
    const posdif2 = (pos2 - pos) / dir
    if (Math.abs(posdif1) > Math.abs(posdif2))
      return pos2
    else
      return pos1
  }
}

const run = (deltaTime: number) => {
  const speed = 8
  const deltaPos = deltaTime * speed

  // front wheels
  train.front.pos += deltaPos * train.front.dir
  // eslint-disable-next-line no-constant-condition
  while (true) if (!checkBeyond(train.front)) break


  // end wheels
  // eslint-disable-next-line no-constant-condition
  while (true) {
    train.back.pos = findBackPosOnRail(train.front, train.back)
    if (!checkBeyond(train.back)) break
  }
}

const checkBeyond = (loc: { rail: LinkedRail, pos: number, dir: number }) => {
  const beyond = loc.dir === 1 && loc.pos > loc.rail.length
  const before = loc.dir === -1 && loc.pos < 0
  if (!beyond && !before) return false
  if (beyond) {
    const prevRail = loc.rail
    if (!prevRail.end) throw 'Derailed!'
    loc.rail = prevRail.end.rail
    const posLeft = loc.pos - prevRail.length
    if (prevRail.end.to === 'start') {
      loc.pos = posLeft
      loc.dir = 1
    } else {
      loc.pos = loc.rail.length - posLeft
      loc.dir = -1
    }
  } else if (before) {
    const prevRail = loc.rail
    if (!prevRail.start) throw 'Derailed!'
    loc.rail = prevRail.start.rail
    const posLeft = 0 - loc.pos
    if (prevRail.start.to === 'start') {
      loc.pos = posLeft
      loc.dir = 1
    } else {
      train.back.pos = train.back.rail.length - posLeft
      train.back.dir = -1
    }
  }
  return true
}

const getPos = (loc: { rail: LinkedRail, pos: number, dir: number }) => {
  const { rail, pos } = loc
  if (rail.type === 'curve') {
    const theta = rail.startTheta + pos / rail.r
    return rail.c.add(new V(Math.cos(theta), Math.sin(theta)).scale(rail.r))
  } else {
    const n = rail.endPos.sub(rail.startPos).norm()
    return rail.startPos.add(n.scale(pos))
  }
}

for (let i = 0; i < 100;i++) {
  const frontPos = getPos(train.front)
  const backPos = getPos(train.back)
  console.log(frontPos.show(), backPos.show(), frontPos.sub(backPos).len())
  run(1)
}
