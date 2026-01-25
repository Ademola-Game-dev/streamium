import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";

type HTMLAttrs = Record<string, string | number | boolean | null | undefined>;

interface MentionNode {
  attrs: {
    id?: string | null;
    label?: string | null;
  };
}

export interface MentionOptions {
  HTMLAttributes?: HTMLAttrs;
  renderLabel?: (props: { options: MentionOptions; node: MentionNode }) => string;
  suggestion?: Partial<SuggestionOptions>;
}

interface CommandProps {
  id: number;
  label: string;
}

export const Mention = Extension.create<MentionOptions>({
  name: "mention",

  addOptions() {
    return {
      HTMLAttributes: {},
      renderLabel({ options, node }) {
        return `@${node.attrs.label ?? ""}`;
      },
      suggestion: {
        char: "@",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: CommandProps;
        }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: "text",
                text: `@${props.label}`,
                marks: [
                  {
                    type: "mention",
                    attrs: { id: props.id, label: props.label },
                  },
                ],
              },
              {
                type: "text",
                text: " ",
              },
            ])
            .run();
        },
        allow: ({ editor, range }: { editor: Editor; range: Range }) => {
          return editor.can().insertContentAt(range, {});
        },
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-mention-id"),
        renderHTML: (attributes: { id?: string | null }) => {
          if (!attributes.id) {
            return {};
          }

          return {
            "data-mention-id": attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-mention-label"),
        renderHTML: (attributes: { label?: string | null }) => {
          if (!attributes.label) {
            return {};
          }

          return {
            "data-mention-label": attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention]",
      },
    ];
  },

  renderHTML({
    node,
    HTMLAttributes,
  }: {
    node: MentionNode;
    HTMLAttributes: HTMLAttrs;
  }) {
    return [
      "span",
      {
        "data-mention": "",
        class: "mention text-primary-400",
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
      },
      this.options.renderLabel({
        options: this.options,
        node,
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
