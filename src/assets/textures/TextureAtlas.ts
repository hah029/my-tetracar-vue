import * as THREE from "three";

// Интерфейс для JSON от TexturePacker (формат "JSON (Array)")
interface TexturePackerFrame {
    filename: string;
    frame: { x: number; y: number; w: number; h: number };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
}

interface TexturePackerMeta {
    app: string;
    version: string;
    image: string;
    format: string;
    size: { w: number; h: number };
    scale: string;
}

interface TexturePackerData {
    frames: TexturePackerFrame[];
    meta: TexturePackerMeta;
}

/**
 * Данные для одного спрайта из атласа
 * Содержит текстуру THREE.JS и UV-координаты для отображения
 */
export class AtlasSprite {
    public texture: THREE.Texture;
    public frame: TexturePackerFrame;
    public uvRect: { u: number; v: number; w: number; h: number };
    public width: number;
    public height: number;

    constructor(texture: THREE.Texture, frame: TexturePackerFrame) {
        this.texture = texture;
        this.frame = frame;

        // Предвычисляем UV-координаты для этого спрайта в атласе
        const atlasW = texture.image.width;
        const atlasH = texture.image.height;
        
        // Standard UV (0-1 range)
        this.uvRect = {
            u: frame.frame.x / atlasW,
            v: 1 - (frame.frame.y + frame.frame.h) / atlasH, // flip Y
            w: frame.frame.w / atlasW,
            h: frame.frame.h / atlasH
        };
        
        this.width = frame.sourceSize.w;
        this.height = frame.sourceSize.h;
    }

    /**
     * Применить этот спрайт к материалу
     */
    applyToMaterial(material: THREE.Material): void {
        if ('map' in material && material.map) {
            material.map = this.texture;
            material.map.repeat.set(this.uvRect.w, this.uvRect.h);
            material.map.offset.set(this.uvRect.u, this.uvRect.v);
        }
    }
}

/**
 * Загрузчик атласов TexturePacker
 */
export class TextureAtlas {
    private data: TexturePackerData | null = null;
    private atlasTexture: THREE.Texture | null = null;
    private sprites: Map<string, AtlasSprite> = new Map();
    private isLoading: Promise<void> | null = null;

    constructor(
        private jsonPath: string,
        private pngPath: string
    ) {}

    /**
     * Загрузить атлас (асинхронно)
     */
    async load(): Promise<void> {
        if (this.isLoading) return this.isLoading;
        
        this.isLoading = new Promise(async (resolve) => {
            try {
                // Загружаем JSON
                const response = await fetch(this.jsonPath);
                this.data = await response.json();
                
                // Загружаем текстуру атласа
                const loader = new THREE.TextureLoader();
                this.atlasTexture = await loader.loadAsync(this.pngPath);
                
                // Создаем спрайты для каждого фрейма
                for (const frame of this.data!.frames) {
                    const sprite = new AtlasSprite(this.atlasTexture, frame);
                    this.sprites.set(frame.filename, sprite);
                }
                
                console.log(`✅ TextureAtlas loaded: ${this.sprites.size} sprites`);
                resolve();
            } catch (error) {
                console.error('Failed to load texture atlas:', error);
                resolve();
            }
        });
        
        return this.isLoading;
    }

    /**
     * Получить спрайт по имени файла
     */
    getSprite(filename: string): AtlasSprite | undefined {
        return this.sprites.get(filename);
    }

    /**
     * Получить основную текстуру атласа (для инстансинга)
     */
    getAtlasTexture(): THREE.Texture | null {
        return this.atlasTexture;
    }

    /**
     * Получить все спрайты для итерации
     */
    getAllSprites(): Map<string, AtlasSprite> {
        return this.sprites;
    }
}