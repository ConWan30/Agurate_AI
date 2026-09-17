import emblemAsset from '@/assets/agurateai-brand-emblem.png.asset.json';

interface BrandEmblemProps {
  className?: string;
}

export function BrandEmblem({ className = 'h-12 w-12' }: BrandEmblemProps) {
  return (
    <img
      src={emblemAsset.url}
      alt="AgurateAI emblem"
      className={`${className} rounded-full object-cover`}
    />
  );
}