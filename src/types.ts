import V from '@/vector'

export type CurveRail = {
  type: 'curve'
  c: V
  r: number
  startTheta: number
  endTheta: number
}

export type StraightRail = {
  type: 'straight'
  startPos: V
  endPos: V
}

export type Rail = CurveRail | StraightRail

export type RailLink = [
  { id: number, from: 'start' | 'end'},
  { id: number, from: 'start' | 'end'},
]

export type LinkedRail = Rail & {
  id: number
  length: number
  end?: { rail: LinkedRail, to: 'start' | 'end'}
  start?: { rail: LinkedRail, to: 'start' | 'end'}
}
