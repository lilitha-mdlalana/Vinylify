import { CreateMixtapeWizard } from "@/components/mixtape/create-mixtape-wizard";
import { Suspense } from "react";

export default function NewMixtapePage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-0 flex-1 items-center justify-center text-sm">
          Loading…
        </div>
      }
    >
      <CreateMixtapeWizard />
    </Suspense>
  );
}
