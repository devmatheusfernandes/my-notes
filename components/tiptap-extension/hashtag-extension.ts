import { Mark, mergeAttributes } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import suggestion, { SuggestionOptions } from '@tiptap/suggestion';

export interface HashtagOptions {
  HTMLAttributes: Record<string, string | number | boolean | undefined>;
  suggestion: Omit<SuggestionOptions, 'editor'>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    hashtag: {
      setHashtag: (attributes: { id: string; label: string }) => ReturnType;
      unsetHashtag: () => ReturnType;
    };
  }
}

export const HashtagExtension = Mark.create<HashtagOptions>({
  name: 'hashtag',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'hashtag text-emerald-500 cursor-pointer hover:underline font-medium bg-emerald-500/10 px-1 rounded',
      },
      suggestion: {
        char: '#',
        command: ({ editor, range, props }) => {
          // If the selected item is a new tag, we might just use the label
          const label = props.label.startsWith('#') ? props.label : `#${props.label}`;
          
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: 'text',
                text: label,
                marks: [
                  {
                    type: this.name,
                    attrs: { id: props.id, label: label },
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
        parseHTML: element => element.getAttribute('data-tag-id'),
        renderHTML: attributes => ({
          'data-tag-id': attributes.id,
        }),
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-tag-label'),
        renderHTML: attributes => ({
          'data-tag-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-tag-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHashtag: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetHashtag: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('suggestion-hashtag'),
        ...this.options.suggestion,
      }),
    ];
  },
});
