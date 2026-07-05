export type ImageSource =
  | 'manual_url'
  | 'local_file'
  | 'public_asset'
  | 'generation_job_public_asset'
  | 'comfyui'
  | 'openai'
  | 'midjourney'
  | 'other'
  | string;

export type RiccoPanelImage = {
  id: string;
  panelId: string;
  imageUrl: string;
  source: ImageSource;
  promptUsed: string;
  rating: number;
  continuityScore: number;
  notes: string;
  selected: boolean;
  createdAt: string;
  generationJobId?: string;
  promptId?: string;
};
