import { MushroomLoader } from "@/components/ui/mushroom-loader";

export default function CustomerLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center py-16">
      <MushroomLoader size="xl" />
    </div>
  );
}
