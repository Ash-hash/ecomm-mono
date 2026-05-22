/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fetcher } from '@repo/api-client';

type Props = {
  images: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean; // 👈 NEW
};

const API_URL =
  process.env.NEXT_PUBLIC_ASSET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
  'http://localhost:3000';

export const getTenantUrl = (path: string) => {
  if (path.startsWith('http')) return path;

  return `${API_URL}${path}`;
};

export const getImageUrl = getTenantUrl;

export default function ImageUploader({
  images,
  onChange,
  multiple = true,
}: Props) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploadedUrls: string[] = [];

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          const data = await fetcher<{ url: string }, FormData>('/upload', {
            method: 'POST',
            body: formData,
          });

          uploadedUrls.push(data.url);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }

      if (multiple) {
        onChange([...images, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls);
      }
    },
    [images, onChange, multiple],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles: multiple ? undefined : 1, // 👈 restrict
  });

  function removeImage(index: number) {
    const copy = [...images];
    copy.splice(index, 1);
    onChange(copy);
  }

  return (
    <div>
      {/* DROP AREA */}
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #3a3a5a',
          padding: 20,
          borderRadius: 10,
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive
          ? 'Drop image here...'
          : multiple
            ? 'Drag & drop or click to upload images'
            : 'Drag & drop or click to upload image'}
      </div>

      {/* PREVIEW GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 100px)',
          gap: 12,
          marginTop: 16,
        }}
      >
        {images.map((img, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img
              src={getImageUrl(img)}
              style={{
                width: 100,
                height: 100,
                objectFit: 'cover',
                borderRadius: 8,
              }}
            />

            {/* REMOVE BUTTON */}
            <button
              onClick={() => removeImage(i)}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                border: 'none',
                width: 20,
                height: 20,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
