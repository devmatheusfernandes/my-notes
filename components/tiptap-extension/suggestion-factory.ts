import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance, GetReferenceClientRect } from 'tippy.js'
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import { SuggestionList, SuggestionListRef, SuggestionListProps, SuggestionItem } from './SuggestionList'

export const createSuggestionRender = () => {
  return () => {
    let component: ReactRenderer<SuggestionListRef, SuggestionListProps>
    let popup: Instance[]

    return {
      onStart: (props: SuggestionProps<SuggestionItem>) => {
        component = new ReactRenderer(SuggestionList, {
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

      onUpdate(props: SuggestionProps<SuggestionItem>) {
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

        return (component?.ref as SuggestionListRef | null)?.onKeyDown(props) || false
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  }
}
