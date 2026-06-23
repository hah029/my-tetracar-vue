import * as THREE from "three";
import {
	REQUIRED_ATLAS_SPRITES,
	type AtlasSpriteName,
} from "@/assets/textures/atlasSprites";

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
			//   v: 1 - (frame.frame.y + frame.frame.h) / atlasH, // flip Y
			v: frame.frame.y / atlasH,
			w: frame.frame.w / atlasW,
			h: frame.frame.h / atlasH,
		};

		this.width = frame.sourceSize.w;
		this.height = frame.sourceSize.h;
	}

	/**
	 * Применить этот спрайт к материалу
	 */
	applyToMaterial(material: THREE.Material): void {
		if ("map" in material && material.map) {
			material.map = this.texture.clone();
			material.map.repeat.set(this.uvRect.w, this.uvRect.h);
			material.map.offset.set(this.uvRect.u, this.uvRect.v);
			material.map.needsUpdate = true;
		}
	}

	applyToGeometry(geometry: THREE.BufferGeometry): void {
		const uv = geometry.attributes.uv;

		for (let i = 0; i < uv.count; i++) {
			const u = uv.getX(i);
			const v = uv.getY(i);

			uv.setXY(
				i,
				this.uvRect.u + u * this.uvRect.w,
				this.uvRect.v + v * this.uvRect.h
			);
		}

		uv.needsUpdate = true;
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

	constructor(private jsonPath: string, private pngPath: string) {}

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
				this.atlasTexture.colorSpace = THREE.SRGBColorSpace;
				this.atlasTexture.flipY = false;

				this.atlasTexture.magFilter = THREE.LinearFilter;
				this.atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
				//this.atlasTexture.magFilter = THREE.NearestFilter;     // Четкие пиксели вблизи
				//this.atlasTexture.minFilter = THREE.NearestMipmapLinearFilter; // Плавные мипмапы вдали
				this.atlasTexture.generateMipmaps = true;

				// this.atlasTexture.magFilter = THREE.NearestFilter;
				// this.atlasTexture.minFilter = THREE.NearestFilter;
				// this.atlasTexture.generateMipmaps = false;
				this.atlasTexture.needsUpdate = true;

				// Создаем спрайты для каждого фрейма
				for (const frame of this.data!.frames) {
					const sprite = new AtlasSprite(this.atlasTexture, frame);
					this.sprites.set(frame.filename, sprite);
				}
				this.validateRequiredSprites();

				console.log(
					`✅ TextureAtlas loaded: ${this.sprites.size} sprites`
				);
				resolve();
			} catch (error) {
				console.error("Failed to load texture atlas:", error);
				resolve();
			}
		});

		return this.isLoading;
	}

	/**
	 * Получить спрайт по имени файла
	 */
	getSprite(filename: AtlasSpriteName): AtlasSprite | undefined {
		return this.sprites.get(filename);
	}

	hasSprite(filename: AtlasSpriteName): boolean {
		return this.sprites.has(filename);
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

	private validateRequiredSprites(): void {
		const missing = REQUIRED_ATLAS_SPRITES.filter(
			(spriteName) => !this.sprites.has(spriteName),
		);

		if (missing.length > 0) {
			throw new Error(
				`Texture atlas is missing required sprites: ${missing.join(", ")}`,
			);
		}
	}
}

export function applyAtlasUV(
	geometry: THREE.BufferGeometry,
	sprite: AtlasSprite
): THREE.BufferGeometry {
	const cloned = geometry.clone();

	const uv = cloned.attributes.uv;

	for (let i = 0; i < uv.count; i++) {
		const u = uv.getX(i);
		const v = uv.getY(i);

		uv.setXY(
			i,
			sprite.uvRect.u + u * sprite.uvRect.w,

			sprite.uvRect.v + v * sprite.uvRect.h
		);
	}

	uv.needsUpdate = true;

	return cloned;
}

import atlasJsonUrl from "./atlas/tetrocar_atlas_test.json?url";
import atlasPngUrl from "./atlas/tetrocar_atlas_test.png";

export const atlas = new TextureAtlas(atlasJsonUrl, atlasPngUrl);

export async function loadAtlas() {
	await atlas.load();
}
