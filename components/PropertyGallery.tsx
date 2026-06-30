"use client";

import { useState } from "react";
import Image from "next/image";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export default function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [mainImage, setMainImage] = useState(images[0] || "");

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-200 animate-pulse" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl shadow-sm group">
        <Image
          src={mainImage}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-mosque text-white text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            Premium
          </span>
          <span className="bg-white/90 backdrop-blur text-nordic-dark text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            New
          </span>
        </div>
        <button className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-nordic-dark px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur transition-all flex items-center gap-2">
          <span className="material-icons text-sm">grid_view</span>
          View All Photos
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto hide-scroll pb-2 snap-x">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setMainImage(img)}
              className={`flex-none w-48 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer snap-start transition-opacity ${
                mainImage === img
                  ? "ring-2 ring-mosque ring-offset-2 ring-offset-background-light opacity-100"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${title} - Thumbnail ${idx + 1}`}
                width={200}
                height={150}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
