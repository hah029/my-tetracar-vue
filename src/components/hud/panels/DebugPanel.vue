<template>
    <div v-if="visible" class="debug-panel">
        <div class="debug-header">
            <strong>🔧 TetroCar Debug Panel</strong>
            <span class="debug-hint">Ctrl+Q</span>
        </div>
        
        <div class="debug-content">
            <div class="debug-row">
                <span class="debug-label">🎨 Triangles:</span>
                <span class="debug-value">{{ formatNumber(stats.triangles) }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">🔺 Vertices:</span>
                <span class="debug-value">{{ formatNumber(stats.vertices) }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">📦 3D Objects:</span>
                <span class="debug-value">{{ stats.objectsCount }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">🎯 Draw Calls:</span>
                <span class="debug-value" :class="{ warning: stats.drawCalls > 300 }">
                    {{ stats.drawCalls }}
                </span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">🧩 Geometries:</span>
                <span class="debug-value">{{ stats.geometriesCount }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">🖼️ Textures:</span>
                <span class="debug-value">{{ stats.texturesCount }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">💾 Memory (Geom):</span>
                <span class="debug-value">{{ formatBytes(stats.geometryMemory) }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">🔍 Active Materials:</span>
                <span class="debug-value">{{ stats.materialsCount }}</span>
            </div>
            
            <div class="debug-divider"></div>
            
            <div class="debug-row">
                <span class="debug-label">🖥️ GPU Memory:</span>
                <span class="debug-value">{{ formatBytes(stats.gpuMemory) }}</span>
            </div>
            
            <div class="debug-row">
                <span class="debug-label">⚡ Frame time:</span>
                <span class="debug-value">{{ stats.frameTime.toFixed(2) }} ms</span>
            </div>
            
            <div class="debug-warning" v-if="stats.drawCalls > 400">
                ⚠️ High Draw Calls! Consider batching or instancing.
            </div>
            
            <div class="debug-warning" v-if="stats.triangles > 500000">
                ⚠️ High triangle count! Optimize geometry.
            </div>
        </div>
    </div>
</template>
  

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { Scene, WebGLRenderer } from 'three'

// Интерфейсы
interface DebugStats {
  triangles: number
  vertices: number
  objectsCount: number
  drawCalls: number
  geometriesCount: number
  texturesCount: number
  geometryMemory: number
  materialsCount: number
  gpuMemory: number
  frameTime: number
}

// Состояние
const visible = ref<boolean>(false)
const stats = ref<DebugStats>({
  triangles: 0,
  vertices: 0,
  objectsCount: 0,
  drawCalls: 0,
  geometriesCount: 0,
  texturesCount: 0,
  geometryMemory: 0,
  materialsCount: 0,
  gpuMemory: 0,
  frameTime: 16.6
})

let scene: Scene | null = null
let renderer: WebGLRenderer | null = null
let updateInterval: number | null = null
let lastFrameTime: number = performance.now()
let animationFrameId: number | null = null

// Вспомогательные функции
const formatNumber = (num: number): string => {
  if (num > 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num > 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Сбор статистики
const collectStats = (): void => {
  if (!scene || !renderer) {
    console.warn('DebugPanel: No scene or renderer for stats collection');
    return;
  }

  let totalTriangles = 0
  let totalVertices = 0
  let objectsCount = 0
  const geometriesSet = new Set<number>()
  const materialsSet = new Set<number>()
  let geometryMemoryTotal = 0

  // Обход сцены
  scene.traverse((object: any) => {
    if (object.isMesh) {
      objectsCount++
      
      const geometry = object.geometry
      if (geometry) {
        geometriesSet.add(geometry.id)
        
        // Подсчет треугольников и вершин
        if (geometry.index) {
          totalTriangles += geometry.index.count / 3
        } else if (geometry.attributes.position) {
          totalTriangles += geometry.attributes.position.count / 3
        }
        
        if (geometry.attributes.position) {
          totalVertices += geometry.attributes.position.count
        }
        
        // Подсчет памяти геометрии
        let geomMem = 0
        for (const key in geometry.attributes) {
          const attr = geometry.attributes[key]
          if (attr && attr.count && attr.itemSize) {
            geomMem += attr.count * attr.itemSize * 4
          }
        }
        if (geometry.index) {
          geomMem += geometry.index.count * 2
        }
        geometryMemoryTotal += geomMem
      }
      
      // Собираем материалы
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m: any) => materialsSet.add(m.id))
        } else {
          materialsSet.add(object.material.id)
        }
      }
    }
  })

    // Draw Calls - правильный доступ к info.render
    let drawCalls = 0;
    if (renderer.info && renderer.info.render) {
        drawCalls = renderer.info.render.calls || 0;
        // Также проверяй другие возможные места
        console.log('🔍 DrawCalls from renderer:', drawCalls);
        console.log('🔍 Full renderer.info:', renderer.info);
    };
  
  // Дополнительно: пробуем получить из renderer.info.programs для шейдерных переключений
  const shaderPrograms = renderer.info.programs?.length || 0

  // Сбор текстур
  const texturesSet = new Set<number>()
  let gpuMemoryEstimate = 0

  materialsSet.forEach(materialId => {
    let material: any = null
    scene!.traverse((object: any) => {
      if (object.isMesh && object.material && !material) {
        const mat = Array.isArray(object.material) ? object.material : [object.material]
        mat.forEach((m: any) => {
          if (m.id === materialId) material = m
        })
      }
    })
    
    if (material) {
      const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']
      textureProps.forEach(prop => {
        const tex = material[prop]
        if (tex && tex.isTexture && tex.image) {
          texturesSet.add(tex.id)
          if (tex.image.width && tex.image.height) {
            const size = tex.image.width * tex.image.height * 4
            gpuMemoryEstimate += size
          }
        }
      })
    }
  })

  // Обновляем состояние
  stats.value = {
    ...stats.value,
    triangles: Math.floor(totalTriangles),
    vertices: totalVertices,
    objectsCount,
    drawCalls,
    geometriesCount: geometriesSet.size,
    materialsCount: materialsSet.size,
    texturesCount: texturesSet.size,
    geometryMemory: geometryMemoryTotal,
    gpuMemory: gpuMemoryEstimate
  }

  // Логируем для отладки (раскомментируй если нужно)
  // console.log('Stats updated:', {
  //   triangles: totalTriangles,
  //   objects: objectsCount,
  //   drawCalls,
  //   geometries: geometriesSet.size
  // });

  // Сброс счетчика вызовов рендерера
    if (renderer.info && renderer.info.reset) renderer.info.reset();
    if (renderer.info.render.calls > 0) renderer.info.reset();
};

// Мониторинг frame time
const monitorFrameTime = (): void => {
  const measureFrame = () => {
    if (visible.value) {
      const now = performance.now()
      const delta = now - lastFrameTime
      if (delta > 0 && delta < 100) {
        stats.value.frameTime = delta
      }
      lastFrameTime = now
    }
    animationFrameId = requestAnimationFrame(measureFrame)
  }
  animationFrameId = requestAnimationFrame(measureFrame)
}

// Обработчик клавиш
const handleKeydown = (e: KeyboardEvent): void => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
    e.preventDefault()
    visible.value = !visible.value
    console.log('DebugPanel visibility:', visible.value)
  }
}

// Инициализация
const initDebug = (): void => {
  console.log('🔍 DebugPanel: Looking for __THREE_DEBUG__...')
  const threeDebug = (window as any).__THREE_DEBUG__
  
  console.log('🔍 DebugPanel: threeDebug =', threeDebug)
  
  if (!threeDebug?.scene || !threeDebug?.renderer) {
    console.warn('DebugPanel: Scene or Renderer not found')
    return
  }

  scene = threeDebug.scene
  renderer = threeDebug.renderer
  
  console.log('✅ DebugPanel: Initialized', {
    scene: scene ? 'OK' : 'NO',
    renderer: renderer ? 'OK' : 'NO',
    rendererInfo: renderer?.info ? 'OK' : 'NO'
  })
  
  // Тестовый сбор статистики через 1 секунду
  setTimeout(() => {
    if (scene && renderer) {
      console.log('DebugPanel: Test stats collection...')
      collectStats()
      console.log('Stats after test:', stats.value)
    }
  }, 1000)
}

// Lifecycle hooks
onMounted(() => {
  console.log('🟢 DebugPanel component mounted')
  initDebug()
  
  if (!scene || !renderer) {
    console.warn('⚠️ DebugPanel: No scene/renderer, retrying...')
    // Повторяем инициализацию несколько раз
    let retries = 0
    const interval = setInterval(() => {
      if (scene && renderer) {
        clearInterval(interval)
        console.log('✅ DebugPanel: Retry successful')
        setupPanel()
      } else if (retries++ > 5) {
        clearInterval(interval)
        console.error('❌ DebugPanel: Failed to initialize after 5 retries')
      } else {
        initDebug()
      }
    }, 500)
    return
  }
  
  setupPanel()
})

const setupPanel = () => {
  window.addEventListener('keydown', handleKeydown)
  monitorFrameTime()
  
  updateInterval = window.setInterval(() => {
    if (visible.value && scene && renderer) {
      collectStats()
    }
  }, 500)
}

onBeforeUnmount(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('keydown', handleKeydown)
})
</script>
  

<style scoped>
    .debug-panel {
        position: fixed;
        top: 100px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        color: #0f0;
        font-family: monospace;
        font-size: 12px;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #0f0;
        z-index: 9999;
        min-width: 220px;
        pointer-events: none;
        user-select: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .debug-content {
        margin-top: 6px;
    }

    .debug-row {
        display: flex;
        justify-content: space-between;
        margin: 3px 0;
        line-height: 1.4;
    }

    .debug-label {
        opacity: 0.8;
    }

    .debug-value {
        font-weight: bold;
        color: #0f0;
    }

    .debug-value.warning {
        color: #ff6600;
        animation: pulse 1s infinite;
    }

    .debug-divider {
        border-top: 1px solid rgba(0, 255, 0, 0.3);
        margin: 6px 0;
    }

    .debug-warning {
        color: #ff6600;
        font-size: 10px;
        margin-top: 6px;
        padding-top: 4px;
        border-top: 1px solid rgba(255, 102, 0, 0.3);
    }

    .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #0f0;
        padding-bottom: 4px;
        margin-bottom: 6px;
    }

    .debug-hint {
        font-size: 10px;
        opacity: 0.6;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
</style>