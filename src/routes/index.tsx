import { createFileRoute } from "@tanstack/react-router";
import { ResultsPage } from "@/components/studio/ResultsPage";

export const Route = createFileRoute("/")({
  component: ResultsPage,
});
