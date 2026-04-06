import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface SearchHighlightOptions {
  searchTerm: string
  className: string
}

export const SearchHighlight = Extension.create<SearchHighlightOptions>({
  name: 'searchHighlight',

  addOptions() {
    return {
      searchTerm: '',
      className: 'bg-amber-500/30 dark:bg-amber-500/50 rounded-sm px-0.5 ring-1 ring-amber-500/20 text-foreground search-highlight transition-all duration-500',
    }
  },

  addProseMirrorPlugins() {
    const { options } = this

    return [
      new Plugin({
        key: new PluginKey('searchHighlight'),
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldState, oldEditorState, newEditorState) {
            const searchTermRaw = options.searchTerm
            const searchTerm = searchTermRaw ? searchTermRaw.trim() : ''
            const className = options.className

            if (!searchTerm || searchTerm.length < 2) {
              return DecorationSet.empty
            }

            // Only recalculate if the doc changed or if the searchTerm changed (via options update)
            // tr.docChanged is true if the document was altered.
            // But we also want to catch options changes.
            
            const decorations: Decoration[] = []
            const { doc } = newEditorState

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text.toLowerCase()
                const lowerSearch = searchTerm.toLowerCase()
                let index = text.indexOf(lowerSearch)

                while (index !== -1) {
                  decorations.push(
                    Decoration.inline(pos + index, pos + index + searchTerm.length, {
                      class: className,
                    })
                  )
                  index = text.indexOf(lowerSearch, index + searchTerm.length)
                }
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})
