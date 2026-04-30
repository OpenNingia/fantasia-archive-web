import MarkdownIt from "markdown-it"

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false
})

export function useMarkdown () {
  return {
    render: (input: string) => md.render(input || "")
  }
}
