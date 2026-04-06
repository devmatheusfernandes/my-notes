import { Mark, mergeAttributes } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import suggestion, { SuggestionOptions } from '@tiptap/suggestion';

export interface NoteLinkOptions {
  HTMLAttributes: Record<string, string | number | boolean | undefined>;
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteLink: {
      setNoteLink: (attributes: { id: string; label: string }) => ReturnType;
      unsetNoteLink: () => ReturnType;
    };
  }
}

export const NoteLinkExtension = Mark.create<NoteLinkOptions>({
  name: 'noteLink',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'note-link text-primary cursor-pointer hover:underline font-medium bg-primary/10 px-1 rounded',
      },
      suggestion: {
        char: '[[',
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: 'text',
                text: props.label,
                marks: [
                  {
                    type: this.name,
                    attrs: { id: props.id, label: props.label },
                  },
                ],
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-id'),
        renderHTML: attributes => ({
          'data-note-id': attributes.id,
        }),
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-label'),
        renderHTML: attributes => ({
          'data-note-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-note-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setNoteLink: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetNoteLink: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('suggestion-note-link'),
        ...this.options.suggestion,
      }),
    ];
  },
});
