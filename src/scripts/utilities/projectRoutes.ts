/**
 * URL builders for project-scoped routes. Keep the project id in the URL so a hard
 * refresh (F5) lands the user back on the same project without any localStorage state.
 */

export function projectHomePath (projectId: string | null | undefined): string {
  if (!projectId) {
    return "/"
  }
  return `/project/${projectId}`
}

export function documentPath (
  projectId: string | null | undefined,
  type: string,
  docId: string
): string {
  if (!projectId) {
    return "/"
  }
  return `/project/${projectId}/display-content/${type}/${docId}`
}
