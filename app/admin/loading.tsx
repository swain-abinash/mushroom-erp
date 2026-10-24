import { MushroomLoader } from "@/components/ui/mushroom-loader";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[55vh] w-full items-center justify-center">
      <MushroomLoader size="xl" />
    </div>
  );
}
