export type CroppedImage = { src: string, id: string, scroll: number }
export type Slide = { duration: number, image: CroppedImage }
export type Audio = { startAt: number, duration: number, src: string }