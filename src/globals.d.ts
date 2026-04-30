declare module "*.md"{
  const content: string
  export default content
}

declare module "*.png"{
  const content: string
  export default content
}

declare module "*.ttf"{
  const content: string
  export default content
}

declare module "@quasar/quasar-ui-qmarkdown" {
  import type { Plugin } from "vue"
  const QMarkdown: Plugin
  export default QMarkdown
  export { QMarkdown }
}

declare module "@quasar/quasar-ui-qmarkdown/dist/index.css"

