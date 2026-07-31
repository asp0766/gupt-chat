export async function uploadMedia(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UNSIGNED_UPLOAD_PRESET;
  if (file.size > 10 * 1024 * 1024) throw new Error('Media files must be 10 MB or smaller.');
  const form = new FormData();
  form.append('file', file);
  const usingCloudinary = Boolean(cloudName && preset);
  if (usingCloudinary) form.append('upload_preset', preset);
  const resourceType = file.type.startsWith('image/') ? 'image' : 'video';
  const apiUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  const response = await fetch(usingCloudinary ? `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload` : `${apiUrl}/api/media`, { method: 'POST', body: form });
  const body = await response.json();
  const mediaUrl = usingCloudinary ? body.secure_url : body.mediaUrl;
  if (!response.ok || !mediaUrl) throw new Error(body.error?.message || body.error || 'Media upload failed.');
  return mediaUrl;
}

export function initials(name) { return name.slice(0, 2).toUpperCase(); }
export function formatTime(value) { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
