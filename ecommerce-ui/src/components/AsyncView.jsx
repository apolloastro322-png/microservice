import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Loading from "./Loading";

export default function AsyncView({ loading, error, onRetry, skeleton, children }) {
  if (loading) {
    return (
      <div aria-busy="true">
        <span className="sr-only">Memuat...</span>
        {skeleton ?? <Loading />}
      </div>
    );
  }
  if (error) {
    return (
      <Alert variant="destructive" className="mt-4 p-4">
        <AlertDescription>{error.message}</AlertDescription>
        <Button
          variant="destructive"
          onClick={onRetry}
          className="mt-3 w-fit"
        >
          Coba lagi
        </Button>
      </Alert>
    );
  }
  return children;
}
