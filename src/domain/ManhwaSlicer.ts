import mitt from "mitt";
import { Framework, interpolated, type InterpolatedNumber } from "../framework";
import type { CroppedImage } from "../shared/types";

const useId = () => {
  return crypto.randomUUID()
}

type Cut = {
  start: null | number
  end: null | number
}

type Change = { crop: CroppedImage, image: HTMLImageElement }

type Events = {
  "crop": CroppedImage
}

export class ManhwaSlicer extends Framework {
  public image: HTMLImageElement 
  public originalImage: HTMLImageElement
  public scrollTop: InterpolatedNumber
  public containerBox: DOMRect
  public canvasBox: DOMRect
  public events = mitt<Events>()
  public changes: Change[] = []
  public theme = {
    crosshairColor: 'grey',
    crosshairColor_Neutral: 'grey',
    crosshairColor_Active: 'red',
  }
  public currentCut: Cut = {
    start: null,
    end: null
  }

  constructor (image: HTMLImageElement, container: HTMLElement, canvas: HTMLCanvasElement) {
    super(container, canvas)
    this.image = image
    this.originalImage = image
    this.containerBox = container.getBoundingClientRect()
    this.canvasBox = canvas.getBoundingClientRect()
    this.canvas.width = this.image.width
    this.canvas.height = this.containerBox.height
    this.scrollTop = interpolated(0, 10, { min: 0, max: this.image.height - this.canvas.height })

    this.mouse.on('wheel', ({ delta }) => {
      this.scrollTop.value = this.scrollTop.target + delta * 2
    })
    
    this.mouse.on('leftClick', ({ position }) => {
      const pos = position.y + this.scrollTop.value
      this.theme.crosshairColor = this.theme.crosshairColor_Active
      if (this.currentCut.start === null) this.currentCut.start = pos
      else if (this.currentCut.end === null) this.currentCut.end = pos
      else {
        const deltaStart = Math.abs(pos - this.currentCut.start)
        const deltaEnd = Math.abs(pos - this.currentCut.end)
        if (deltaStart < deltaEnd) this.currentCut.start = pos
        else this.currentCut.end = pos
      }
    })

    this.mouse.on('rightClick', ({ position }) => {
      if (this.currentCut.start === null) return
      if (this.currentCut.end === null) this.currentCut.end = position.y + this.scrollTop.value
      this.cut()
    })

    this.keyboard.on('escape', () => {
      this.resetCurrentCut()
    })

    this.loop.on('frame', (dt) => {
      this.scrollTop.update(dt)
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
      this.drawImage(this.ctx)
      this.drawCurrentCutBoundaries(this.ctx)
      this.drawCursor(this.ctx)
    })
  }

  on<K extends keyof Events> (
    type: K,
    handler: (payload: Events[K]) => void
  ) {
    this.events.on(type, handler);
  }

  cut () {
    if (this.currentCut.start === null || this.currentCut.end === null) return
    this.theme.crosshairColor = this.theme.crosshairColor_Neutral
    const { croppedImg } = this.getCroppedImage(Math.max(this.currentCut.end, this.currentCut.start), this.image.height - Math.abs(this.currentCut.end - this.currentCut.start))
    const { dataURL } = this.getCroppedImage(Math.min(this.currentCut.start, this.currentCut.end), Math.abs(this.currentCut.end - this.currentCut.start))
    this.scrollTop.value = 0
    const crop: CroppedImage = { src: dataURL, id: useId(), scroll: this.scrollTop.value }
    this.changes.push({ crop, image: this.image.cloneNode() as HTMLImageElement })
    this.image = croppedImg
    this.events.emit('crop', crop)
    this.resetCurrentCut()
    this.image.onload = () => {
      this.scrollTop = interpolated(0, 10, { min: 0, max: this.image.height - this.canvas.height })
    }
  }

  dropChangesUpTo(id: CroppedImage["id"]) {
    for (let i = this.changes.length - 1; i >= 0; i--) {
      if (this.changes[i]?.crop.id  === id) break;
      this.changes.pop()
    }
    const expectedState = this.changes.pop()
    this.scrollTop.value = 0
    this.image = expectedState!.image
    this.resetCurrentCut()
    this.scrollTop = interpolated(expectedState!.crop!.scroll, 10, { min: 0, max: this.image.height - this.canvas.height })
  }

  getCroppedImage (cropY: number, cropHeight: number) {
    const canvas = document.createElement('canvas');
    canvas.width = this.image.width;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
      this.image,
      0, cropY,
      this.image.width, cropHeight,
      0, 0,
      this.image.width, cropHeight
    );
    const dataURL = canvas.toDataURL('image/png')
    const croppedImg = new Image();
    croppedImg.src = dataURL;
    return { croppedImg, dataURL }
  }

  resetCurrentCut () {
    this.currentCut = { start: null, end: null }
  }

  drawCurrentCutBoundaries(ctx: CanvasRenderingContext2D) {
    if (this.currentCut.start === null) return
    ctx.fillStyle = '#3b27834b'
    const relativeYCutStart = this.currentCut.start - this.scrollTop.value
    const relativeYCutEnd = this.currentCut.end !== null ? (this.currentCut.end - this.scrollTop.value) : this.mouse.position.y
    
    ctx.fillRect(0, relativeYCutStart, ctx.canvas.width, relativeYCutEnd - relativeYCutStart)

    ctx.beginPath()
    ctx.strokeStyle = this.theme.crosshairColor_Active
    ctx.beginPath()
    ctx.setLineDash([5, 10]);
    ctx.moveTo(0, relativeYCutStart)
    ctx.lineTo(ctx.canvas.width, relativeYCutStart)
    ctx.stroke()
    ctx.closePath()
    ctx.setLineDash([])
    if (this.currentCut.end !== null) {
      ctx.beginPath()
      ctx.strokeStyle = this.theme.crosshairColor_Active
      ctx.beginPath()
      ctx.setLineDash([5, 10]);
      ctx.moveTo(0, relativeYCutEnd)
      ctx.lineTo(ctx.canvas.width, relativeYCutEnd)
      ctx.stroke()
      ctx.closePath()
      ctx.setLineDash([])
    }
  }

  drawCursor (ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    ctx.strokeStyle = this.theme.crosshairColor
    ctx.beginPath()
    ctx.setLineDash([5, 10]);
    ctx.moveTo(0, this.mouse.position.y)
    ctx.lineTo(ctx.canvas.width, this.mouse.position.y)
    ctx.stroke()
    ctx.closePath()
    ctx.setLineDash([])
  }

  drawImage (ctx: CanvasRenderingContext2D) {
    ctx.drawImage(
        this.image,
        0, this.scrollTop.value, this.image.width, this.canvas.height,
        0, 0, this.canvas.width, this.canvas.height
    );
  }
}