import Image from "next/image";
import type { SafeImageProps } from "@/types/shared";

export default function SafeImage(props: SafeImageProps) {
  return <Image {...props} suppressHydrationWarning />;
}
