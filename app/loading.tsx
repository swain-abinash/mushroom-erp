import { MushroomLoader } from "@/components/ui/mushroom-loader";

export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <MushroomLoader size="xl" />
    </div>
  );
}
