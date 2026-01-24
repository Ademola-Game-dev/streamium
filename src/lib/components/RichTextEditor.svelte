<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import EmojiPicker from './EmojiPicker.svelte';

  const dispatch = createEventDispatcher<{ input: string }>();
  const EMPTY_CONTENT = '<p></p>';

  export let content = EMPTY_CONTENT;
  export let disabled = false;
  export let class_ = '';

  let element: HTMLDivElement;
  let editor: Editor;

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          hardBreak: false,
          history: {},
        }),
      ],
      content: EMPTY_CONTENT,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        content = editor.getHTML();
        dispatch('input', content);
      },
      editorProps: {
        attributes: {
          class: 'prose prose-invert max-w-none min-h-[120px] p-4 focus:outline-none',
        },
      },
    });

    return () => {
      editor.destroy();
    };
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  export function clear() {
    if (editor) {
      editor.commands.setContent(EMPTY_CONTENT);
      content = EMPTY_CONTENT;
      dispatch('input', content);
    }
  }

  function handleEmojiSelect(event: CustomEvent<string>) {
    if (editor) {
      editor.commands.insertContent(event.detail);
    }
  }

  $: if (editor && disabled !== undefined) {
    editor.setEditable(!disabled);
  }
</script>

<div class="relative {class_} bg-transparent rounded-lg border border-gray-700/50">
  <div
    bind:this={element}
    class="prose-sm prose-invert"
  ></div>

  <div class="border-t border-gray-700/50 p-2 flex gap-2">
    <button
      type="button"
      class="p-1 rounded hover:bg-gray-700/50 transition-colors"
      class:text-blue-400={editor?.isActive('bold')}
      on:click={() => editor?.chain().focus().toggleBold().run()}
      disabled={disabled}
      aria-label="Bold"
      title="Bold"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.6 11.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
      </svg>
    </button>

    <button
      type="button"
      class="p-1 rounded hover:bg-gray-700/50 transition-colors"
      class:text-blue-400={editor?.isActive('italic')}
      on:click={() => editor?.chain().focus().toggleItalic().run()}
      disabled={disabled}
      aria-label="Italic"
      title="Italic"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
      </svg>
    </button>

    <button
      type="button"
      class="p-1 rounded hover:bg-gray-700/50 transition-colors"
      class:text-blue-400={editor?.isActive('strike')}
      on:click={() => editor?.chain().focus().toggleStrike().run()}
      disabled={disabled}
      aria-label="Strikethrough"
      title="Strikethrough"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.24 8.75c-.26-.48-.39-1.03-.39-1.67 0-.61.13-1.16.4-1.67.26-.5.63-.93 1.11-1.29.48-.35 1.05-.63 1.7-.83.66-.19 1.39-.29 2.18-.29.81 0 1.54.11 2.21.34.66.22 1.23.54 1.69.94.47.4.83.88 1.08 1.43.25.55.38 1.15.38 1.81h-3.01c0-.31-.05-.59-.15-.85-.09-.27-.24-.49-.44-.68-.2-.19-.45-.33-.75-.44-.3-.1-.66-.16-1.06-.16-.39 0-.74.04-1.03.13-.29.09-.53.21-.72.36-.19.16-.34.34-.44.55-.1.21-.15.43-.15.66 0 .48.25.88.74 1.21.38.25.77.48 1.41.7H7.39c-.05-.08-.11-.17-.15-.25zM21 12v-2H3v2h9.62c.18.07.4.14.55.2.37.17.66.34.87.51.21.17.35.36.43.57.07.2.11.43.11.69 0 .23-.05.45-.14.66-.09.2-.23.38-.42.53-.19.15-.42.26-.71.35-.29.08-.63.13-1.01.13-.43 0-.83-.04-1.18-.13s-.66-.23-.91-.42c-.25-.19-.45-.44-.59-.75-.14-.31-.25-.76-.25-1.21H6.4c0 .55.08 1.13.24 1.58.16.45.37.85.65 1.21.28.35.6.66.98.92.37.26.78.48 1.22.65.44.17.9.3 1.38.39.48.08.96.13 1.44.13.8 0 1.53-.09 2.18-.28s1.21-.45 1.67-.79c.46-.34.82-.77 1.07-1.27s.38-1.07.38-1.71c0-.6-.1-1.14-.31-1.61-.05-.11-.11-.23-.17-.33H21z"/>
      </svg>
    </button>

    <div class="flex-1"></div>

    <EmojiPicker
      on:select={handleEmojiSelect}
      disabled={disabled}
    />
  </div>
</div>

<style>
  :global(.ProseMirror) {
    outline: none;
  }

  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #9ca3af;
    pointer-events: none;
    height: 0;
  }
</style>
