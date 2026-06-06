import ImageKit from "@imagekit/nodejs";

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY!;

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY!;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT!;

if (!privateKey || !publicKey || !urlEndpoint) {
  throw new Error("Missing ImageKit environment variables");
}

const imagekit = new ImageKit({
  privateKey,
});

export async function uploadMedia(
  file: File,
): Promise<{ url: string; fileId: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await imagekit.files.upload({
    file: buffer.toString("base64"),
    fileName: file.name,
    folder: "/better-media/posts",
  });
  if (!result.url || !result.fileId) {
    throw new Error("ImageKit upload failed: missing url or fileId");
  }
  return { url: result.url, fileId: result.fileId };
}
