import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance, GetReferenceClientRect } from 'tippy.js'
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import { PublicationList, PublicationListRef, PublicationListProps } from './PublicationList'
import { indexedDbService } from '@/services/indexedDbService'
import { JwpubMetadata } from '@/schemas/jwpubSchema'

export const publicationSuggestion = {
  items: async ({ query }: { query: string }) => {
    const metadata = await indexedDbService.getPublicationsMetadata()
    
    return metadata
      .filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.symbol.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5)
  },

  render: () => {
    let component: ReactRenderer<PublicationListRef, PublicationListProps>
    let popup: Instance[]

    return {
      onStart: (props: SuggestionProps<JwpubMetadata>) => {
        component = new ReactRenderer(PublicationList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },

      onUpdate(props: SuggestionProps<JwpubMetadata>) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect as GetReferenceClientRect,
        })
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }

        return (component?.ref as PublicationListRef | null)?.onKeyDown(props) || false
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}
