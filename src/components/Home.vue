<template>
  <div class="home">
    <h1>给亲爱的佘泳蕻老婆(工具包包)</h1>
    <div class="menu">
      <router-link to="/watermark" class="menu-item">
        <div class="card">
          <h2>添加水印</h2>
          <p>为图片添加自定义水印</p>
        </div>
      </router-link>
      <router-link to="/image-converter" class="menu-item">
        <div class="card">
          <h2>图片格式转换</h2>
          <p>转换为常用图片格式</p>
        </div>
      </router-link>
      <router-link to="/pdf2image" class="menu-item">
        <div class="card">
          <h2>PDF转图片</h2>
          <p>PDF文件转换为图片</p>
        </div>
      </router-link>
      <router-link to="/image2pdf" class="menu-item">
        <div class="card">
          <h2>图片转PDF</h2>
          <p>多张图片合并为PDF</p>
        </div>
      </router-link>
      <router-link to="/image-compressor" class="menu-item">
        <div class="card">
          <h2>图片压缩</h2>
          <p>压缩图片大小和尺寸</p>
        </div>
      </router-link>
    </div>
    <Copyright />
  </div>
</template>

<script>
import Copyright from './Copyright.vue'

export default {
  name: 'Home',
  components: {
    Copyright
  },
  data() {
    return {
      gradients: [
        'linear-gradient(45deg, #ff9a9e, #fad0c4)',
        'linear-gradient(45deg, #a1c4fd, #c2e9fb)',
        'linear-gradient(45deg, #ffecd2, #fcb69f)',
        'linear-gradient(45deg, #84fab0, #8fd3f4)',
        'linear-gradient(45deg, #d4fc79, #96e6a1)',
        'linear-gradient(45deg, #a6c0fe, #f68084)',
        'linear-gradient(45deg, #fbc2eb, #a6c1ee)',
        'linear-gradient(45deg, #f6d365, #fda085)',
        'linear-gradient(45deg, #667eea, #764ba2)',
        'linear-gradient(45deg, #ff758c, #ff7eb3)',
        'linear-gradient(45deg, #c471f5, #fa71cd)',
        'linear-gradient(45deg, #4facfe, #00f2fe)',
        'linear-gradient(45deg, #43e97b, #38f9d7)',
        'linear-gradient(45deg, #fa709a, #fee140)',
        'linear-gradient(45deg, #30cfd0, #330867)',
        'linear-gradient(45deg, #a8edea, #fed6e3)',
        'linear-gradient(45deg, #5ee7df, #b490ca)',
        'linear-gradient(45deg, #d299c2, #fef9d7)',
        'linear-gradient(45deg, #f5f7fa, #c3cfe2)',
        'linear-gradient(45deg, #e0c3fc, #8ec5fc)',
        'linear-gradient(45deg, #f093fb, #f5576c)',
        'linear-gradient(45deg, #4481eb, #04befe)',
        'linear-gradient(45deg, #0ba360, #3cba92)',
        'linear-gradient(45deg, #f77062, #fe5196)'
      ]
    }
  },
  methods: {
    getRandomGradient() {
      const index = Math.floor(Math.random() * this.gradients.length)
      return this.gradients[index]
    }
  },
  mounted() {
    const cards = document.querySelectorAll('.card')
    cards.forEach(card => {
      card.style.background = this.getRandomGradient()
    })
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 40px;
}

.menu {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.menu-item {
  text-decoration: none;
  color: inherit;
}

.card {
  border-radius: 8px;
  padding: 20px;
  width: 200px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.card:hover {
  transform: translateY(-5px);
}

.card h2 {
  color: #fff;
  margin-bottom: 10px;
}

.card p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}
</style> 