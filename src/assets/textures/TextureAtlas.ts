import * as THREE from "three";
import atlasJsonUrl from "./atlas/tetrocar_atlas.json?url";
import atlasPngUrl from "./atlas/tetrocar_atlas.png";
import { REQUIRED_ATLAS_SPRITES, type AtlasSpriteName } from "@/assets/textures/atlasSprites";

interface TexturePackerFrame {
	filename: string;
	frame: { x: number; y: number; w: number; h: number };
	rotated: boolean;
	trimmed: boolean;
	spriteSourceSize: { x: number; y: number; w: number; h: number };
	sourceSize: { w: number; h: number };
};

interface TexturePackerMeta {
	app: string;
	version: string;
	image: string;
	format: string;
	size: { w: number; h: number };
	scale: string;
};

interface TexturePackerData {
	frames: TexturePackerFrame[];
	meta: TexturePackerMeta;
};

export class AtlasSprite {
	public texture: THREE.Texture;
	public frame: TexturePackerFrame;
	public uvRect: { u: number; v: number; w: number; h: number };
	public width: number;
	public height: number;

	constructor(texture: THREE.Texture, frame: TexturePackerFrame) {
		this.texture = texture;
		this.frame = frame;

		const image = texture.image as HTMLImageElement | null;
		const atlasW = image?.width || 512;
		const atlasH = image?.height || 512;

		this.uvRect = {
			u: frame.frame.x / atlasW,
			v: frame.frame.y / atlasH,
			w: frame.frame.w / atlasW,
			h: frame.frame.h / atlasH,
		};

		this.width = frame.sourceSize.w;
		this.height = frame.sourceSize.h;
	};

	applyToMaterial(material: THREE.Material): void {
        if (material instanceof THREE.MeshStandardMaterial || 
            material instanceof THREE.MeshBasicMaterial) {
            if (material.map) {
                material.map.repeat.set(this.uvRect.w, this.uvRect.h);
                material.map.offset.set(this.uvRect.u, this.uvRect.v);
                material.map.needsUpdate = true;
            };
        };
    };
};

export class TextureAtlas {
	private data: TexturePackerData | null = null;
	private atlasTexture: THREE.Texture | null = null;
	private sprites: Map<string, AtlasSprite> = new Map();
	private isLoading: Promise<void> | null = null;

	constructor(private jsonPath: string, private pngPath: string) {}

	async load(): Promise<void> {
		if (this.isLoading) return this.isLoading;

		this.isLoading = new Promise(async (resolve) => {
			try {
				const response = await fetch(this.jsonPath);
				this.data = await response.json();

				const loader = new THREE.TextureLoader();
				this.atlasTexture = await loader.loadAsync(this.pngPath);
				
				this.atlasTexture.colorSpace = THREE.SRGBColorSpace;
				this.atlasTexture.flipY = false;
				this.atlasTexture.magFilter = THREE.LinearFilter;
				this.atlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
				this.atlasTexture.generateMipmaps = true;
				this.atlasTexture.needsUpdate = true;

				for (const frame of this.data!.frames) {
					const sprite = new AtlasSprite(this.atlasTexture, frame);
					this.sprites.set(frame.filename, sprite);
				}
				this.validateRequiredSprites();

				console.log(`✅ TextureAtlas loaded: ${this.sprites.size} sprites`);
				resolve();
			} catch (error) {
				console.error("Failed to load texture atlas:", error);
				resolve();
			}
		});

		return this.isLoading;
	}

    private static sharedTexture: THREE.Texture | null = null;

    getSharedTexture(): THREE.Texture | null {
        if (TextureAtlas.sharedTexture) {
            return TextureAtlas.sharedTexture;
        }
        if (!this.atlasTexture) return null;
        TextureAtlas.sharedTexture = this.atlasTexture;
        this.atlasTexture.needsUpdate = true;
        return TextureAtlas.sharedTexture;
    }

	getSprite(filename: AtlasSpriteName): AtlasSprite | undefined {
		return this.sprites.get(filename);
	}

	hasSprite(filename: AtlasSpriteName): boolean {
		return this.sprites.has(filename);
	}

	getAtlasTexture(): THREE.Texture | null {
		return this.atlasTexture;
	}

	getAllSprites(): Map<string, AtlasSprite> {
		return this.sprites;
	}

	private validateRequiredSprites(): void {
		const missing = REQUIRED_ATLAS_SPRITES.filter(
			(spriteName) => !this.sprites.has(spriteName),
		);

		if (missing.length > 0) {
			console.warn(
				`⚠️ Texture atlas is missing required sprites: ${missing.join(", ")}`,
			);
		}
	}
};

export const atlas = new TextureAtlas(atlasJsonUrl, atlasPngUrl);

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
};

export async function loadAtlas() {
	await atlas.load();
};