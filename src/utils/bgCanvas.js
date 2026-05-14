/**
 * 与 preview.html 一致的粒子连线背景 (#bgCanvas)
 */
export function initBgCanvas(canvasEl) {
  if (!canvasEl || typeof canvasEl.getContext !== 'function') return () => {}

  const ctx = canvasEl.getContext('2d')
  if (!ctx) return () => {}

  const particles = []
  let w = 0
  let h = 0
  let raf = 0

  function Particle() {
    this.reset()
  }
  Particle.prototype.reset = function () {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.vx = (Math.random() - 0.5) * 0.25
    this.vy = (Math.random() - 0.5) * 0.25
    this.r = Math.random() * 1.2 + 0.4
    this.alpha = Math.random() * 0.18 + 0.04
    this.warm = Math.random() > 0.6   // 40% 珊瑚暖色，60% 青绿
  }
  Particle.prototype.update = function () {
    this.x += this.vx
    this.y += this.vy
    if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset()
  }
  Particle.prototype.draw = function () {
    ctx.beginPath()
    ctx.arc(this.x, this.y, Math.max(0.1, this.r), 0, Math.PI * 2)
    const col = this.warm ? '212,133,106' : '74,155,142'
    ctx.fillStyle = 'rgba(' + col + ',' + this.alpha + ')'
    ctx.fill()
  }

  function resize() {
    w = canvasEl.width = window.innerWidth
    h = canvasEl.height = window.innerHeight
  }

  function animate() {
    ctx.clearRect(0, 0, w, h)
    for (let i = 0; i < particles.length; i++) {
      particles[i].update()
      particles[i].draw()
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 100) {
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = 'rgba(74,155,142,' + 0.05 * (1 - dist / 100) + ')'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }
    }
    raf = requestAnimationFrame(animate)
  }

  resize()
  window.addEventListener('resize', resize)

  const count = Math.min(60, Math.floor((w * h) / 20000))
  for (let i = 0; i < count; i++) particles.push(new Particle())

  animate()

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}
