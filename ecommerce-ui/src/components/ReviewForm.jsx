import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "../api/reviewApi";
import { describeError } from "../utils/format";

export default function ReviewForm({ productId, userId, onCreated }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await createReview({ productId, userId, rating, comment });
      setComment("");
      setMessage("Review terkirim. Terima kasih!");
      onCreated();
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24"
      onSubmit={handleSubmit}
    >
      <h3 className="font-medium text-foreground">
        Tulis review sebagai user {userId}
      </h3>
      <div className="grid gap-1.5">
        <Label htmlFor="review-rating" className="text-muted-foreground">
          Rating
        </Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="review-rating"
              variant="outline"
              className="w-full justify-between font-normal"
            >
              {rating} bintang
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width)"
          >
            <DropdownMenuRadioGroup
              value={String(rating)}
              onValueChange={(value) => setRating(Number(value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <DropdownMenuRadioItem key={n} value={String(n)}>
                  {n} bintang
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="review-comment" className="text-muted-foreground">
          Komentar
        </Label>
        <Textarea
          id="review-comment"
          rows="3"
          maxLength="1000"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{describeError(error)}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert
          role="status"
          className="border-primary/30 bg-primary/10"
        >
          <AlertDescription className="text-primary">
            {message}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto sm:justify-self-start"
      >
        {submitting ? "Mengirim..." : "Kirim review"}
      </Button>
    </form>
  );
}
