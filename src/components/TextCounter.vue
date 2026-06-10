<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>{{ $t('textCounter.header') }}</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 左侧：文字输入区 -->
      <div class="preview-stack">
        <div class="wm-actions" @click.stop>
          <button class="btn btn-ghost btn-sm" @click="clearText" :disabled="!text">
            {{ $t('textCounter.clear') }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="pasteText">
            {{ $t('textCounter.paste') }}
          </button>
        </div>
        <div class="tc-input-shell">
          <textarea
            ref="textarea"
            v-model="text"
            :placeholder="$t('textCounter.inputPlaceholder')"
            class="tc-textarea"
            @input="onInput"
          ></textarea>
        </div>
      </div>

      <!-- 右侧：统计面板 -->
      <div class="control-panel">
        <div class="setting-card">
          <div class="setting-card-header">
            <h4>{{ $t('textCounter.statsTitle') }}</h4>
          </div>
          <div class="setting-card-body">
            <div class="setting-row">
              <label>{{ $t('textCounter.chars') }}</label>
              <div class="control"><span class="tc-val">{{ stats.chars }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.charsNoSpaces') }}</label>
              <div class="control"><span class="tc-val">{{ stats.charsNoSpaces }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.words') }}</label>
              <div class="control"><span class="tc-val">{{ stats.words }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.lines') }}</label>
              <div class="control"><span class="tc-val">{{ stats.lines }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.paragraphs') }}</label>
              <div class="control"><span class="tc-val">{{ stats.paragraphs }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.chineseChars') }}</label>
              <div class="control"><span class="tc-val">{{ stats.chineseChars }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.englishWords') }}</label>
              <div class="control"><span class="tc-val">{{ stats.englishWords }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.punctuation') }}</label>
              <div class="control"><span class="tc-val">{{ stats.punctuation }}</span></div>
            </div>
            <div class="setting-row">
              <label>{{ $t('textCounter.digits') }}</label>
              <div class="control"><span class="tc-val">{{ stats.digits }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextCounter',
  data() {
    return {
      text: '',
      stats: {
        chars: 0,
        charsNoSpaces: 0,
        words: 0,
        lines: 0,
        paragraphs: 0,
        chineseChars: 0,
        englishWords: 0,
        punctuation: 0,
        digits: 0,
      },
    }
  },
  methods: {
    computeStats() {
      const t = this.text
      this.stats.chars = t.length
      this.stats.charsNoSpaces = t.replace(/\s/g, '').length
      this.stats.chineseChars = (t.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length
      this.stats.englishWords = (t.match(/[a-zA-Z]+/g) || []).length
      const wordSeq = t.match(/[\p{L}\p{N}]+/gu)
      this.stats.words = wordSeq ? wordSeq.length : 0
      this.stats.punctuation = (t.match(/[\p{P}\p{S}]/gu) || []).length
      this.stats.digits = (t.match(/\d/g) || []).length
      if (t.length === 0) {
        this.stats.lines = 0
      } else {
        this.stats.lines = t.split('\n').length
      }
      const trimmed = t.trim()
      if (trimmed.length === 0) {
        this.stats.paragraphs = 0
      } else {
        this.stats.paragraphs = trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
      }
    },
    onInput() {
      this.computeStats()
    },
    clearText() {
      this.text = ''
      this.computeStats()
    },
    async pasteText() {
      try {
        const clipText = await navigator.clipboard.readText()
        if (clipText) {
          this.text = clipText
          this.computeStats()
        }
      } catch {
        // clipboard not available
      }
    },
  },
}
</script>

<style scoped>
:deep(.tool-body) {
  padding-top: var(--spacing-md);
}

/* 输入壳：与 preview-area 视觉一致 — 虚线、毛玻璃、径向光晕、固定高度 */
  .tc-input-shell {
    position: relative;
    width: 100%;
    min-height: var(--tool-preview-area-height);
    border-radius: var(--radius-lg);
    border: 1px dashed var(--color-border);
    background: var(--color-surface-drop, var(--color-surface));
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  }

  .tc-input-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, var(--color-accent-dim), transparent 70%);
    opacity: 0;
    transition: opacity var(--transition-normal);
    pointer-events: none;
  }

  .tc-input-shell:focus-within {
    border-color: var(--color-accent);
    box-shadow: var(--shadow-glow);
  }

  .tc-input-shell:focus-within::before {
    opacity: 1;
  }

  .tc-textarea {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    min-height: var(--tool-preview-area-height);
    padding: 16px 18px;
    border: none;
    background: transparent;
    color: var(--color-foreground);
    font-size: 15px;
    line-height: 1.7;
    font-family: var(--font-body);
    resize: vertical;
    outline: none;
    box-sizing: border-box;
  }

  .tc-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .tc-val {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-accent);
    font-family: var(--font-heading);
  }
</style>
