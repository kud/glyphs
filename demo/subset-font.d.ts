declare module "subset-font" {
  const subsetFont: (
    font: Uint8Array,
    text: string,
    options?: { targetFormat?: "sfnt" | "woff" | "woff2"; preserveNameIds?: number[] },
  ) => Promise<Uint8Array>
  export default subsetFont
}
