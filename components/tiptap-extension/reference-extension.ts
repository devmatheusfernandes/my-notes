import { Mark, mergeAttributes, InputRule, Editor, Range } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { normalizeBookToken } from '@/lib/bible/bible-abreviations';
import { jwpubReference } from '@/lib/jwpub/jwpub-reference';
import { JwpubMetadata } from '@/schemas/jwpubSchema';

export interface ReferenceOptions {
  HTMLAttributes: Record<string, unknown>;
  onReferenceClick?: (reference: string, type: 'bible' | 'publication') => void;
  suggestion?: Partial<SuggestionOptions<JwpubMetadata>>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    reference: {
      /**
       * Set a reference mark
       */
      setReference: (attributes: { reference: string; type: 'bible' | 'publication' }) => ReturnType;
      /**
       * Unset a reference mark
       */
      unsetReference: () => ReturnType;
    };
  }
}

export const ReferenceExtension = Mark.create<ReferenceOptions>({
  name: 'reference',

  inclusive: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'text-amber-500 cursor-pointer hover:underline reference-link font-medium',
      },
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: Editor, range: Range, props: JwpubMetadata }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(`/${props.symbol} `)
            .run();
        },
      },
    };
  },

  addAttributes() {
    return {
      reference: {
        default: null,
        parseHTML: element => element.getAttribute('data-reference'),
        renderHTML: attributes => ({
          'data-reference': attributes.reference,
        }),
      },
      type: {
        default: null,
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => ({
          'data-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-reference]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setReference: attributes => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      unsetReference: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        // Matches @ followed by a Bible book and reference (e.g. @Ge 1:1)
        find: /@((?:[1-3]\s*)?[a-zA-ZçÇáÁéÉíÍóÓúÚâÂêÊôÔãÃõÕüÜ]+)\s+(\d+):(\d+)(?:-(\d+))?\s$/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const bookPart = match[1];
          const isBible = !!normalizeBookToken(bookPart);

          if (isBible) {
            const start = range.from;
            const end = range.to;
            const referenceText = match[0].trim().substring(1); // Remove @ and trailing space

            // Re-insert the text without @ but keep the trailing space outside the mark
            tr.replaceWith(start, end, state.schema.text(referenceText + ' '));
            tr.addMark(start, start + referenceText.length, this.type.create({
              reference: referenceText,
              type: 'bible',
            }));
          }
        },
      }),
      // Unified Publication InputRule removed in favor of handleKeyDown (Enter-based)
    ];
  },

  addProseMirrorPlugins() {
    return [
      suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('suggestion-reference'),
        ...this.options.suggestion,
      }),
      new Plugin({
        key: new PluginKey('reference-handler'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              const { state, dispatch } = view;
              const { $from } = state.selection;

              const currentLineText = $from.nodeBefore?.text || '';
              const lastSlashIndex = currentLineText.lastIndexOf('/');

              if (lastSlashIndex !== -1) {
                const potentialRefText = currentLineText.substring(lastSlashIndex).trim();
                const isPub = jwpubReference.parseReferenceString(potentialRefText);

                if (isPub) {
                  // Text to show as link (strip the leading slash)
                  const displayText = potentialRefText.startsWith('/')
                    ? potentialRefText.substring(1)
                    : potentialRefText;

                  const start = $from.pos - potentialRefText.length;
                  const end = $from.pos;

                  const tr = state.tr
                    .replaceWith(start, end, state.schema.text(displayText))
                    .addMark(start, start + displayText.length, this.type.create({
                      reference: displayText,
                      type: 'publication',
                    }));

                  // Focus the editor after the mark
                  if (dispatch) dispatch(tr);
                  return true; // Prevent default Enter (don't jump to next line)
                }
              }
            }
            return false;
          },
          handleClick: (view, pos) => {
            const { state } = view;
            const $pos = state.doc.resolve(pos);

            const marks = $pos.marks();
            const referenceMark = marks.find(m => m.type.name === this.name);

            if (referenceMark) {
              const { reference, type } = referenceMark.attrs;
              if (this.options.onReferenceClick) {
                this.options.onReferenceClick(reference, type);
                return true;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
