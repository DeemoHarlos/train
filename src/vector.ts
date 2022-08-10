export default class Vector {
  x: number
  y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  scale = (scale: number) => new Vector(scale * this.x, scale * this.y)
  add = (v: Vector) => new Vector(this.x + v.x, this.y + v.y)
  sub = (v: Vector) => new Vector(this.x - v.x, this.y - v.y)
  mul = (v: Vector) => new Vector(this.x * v.x, this.y * v.y)
  div = (v: Vector) => new Vector(this.x / v.x, this.y / v.y)
  dot = (v: Vector) => this.x * v.x + this.y * v.y
  cross = (v: Vector) => this.x * v.y - this.y * v.x
  len = () => Math.sqrt(this.dot(this))
  dist = (v: Vector) => v.sub(this).len()
  norm = () => this.scale(1 / this.len())
  proj = (v: Vector) => v.norm().scale(this.dot(v) / v.len())
  angle = () => Math.atan2(this.y, this.x)
  show = () => `(${this.x}, ${this.y})`
}
