import { useState } from "react";
import { ChevronDownIcon, EllipsisIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteReview, updateReview } from "../api/reviewApi";
import { describeError } from "../utils/format";
import StarRating from "./StarRating";

export default function ReviewItem({ review, userId, onChanged }) {
  const isOwner = review.user_id === userId;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment ?? "");
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);

  // Error aksi sebelumnya tidak boleh terbawa ke dialog berikutnya.
  function openEdit() {
    setRating(review.rating);
    setComment(review.comment ?? "");
    setError(null);
    setEditOpen(true);
  }

  function openDelete() {
    setError(null);
    setDeleteOpen(true);
  }

  async function handleSave() {
    setPending("edit");
    setError(null);
    try {
      await updateReview(review.id, { rating, comment });
      setEditOpen(false);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setPending(null);
    }
  }

  async function handleDelete() {
    setPending("delete");
    setError(null);
    try {
      await deleteReview(review.id);
      setDeleteOpen(false);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setPending(null);
    }
  }

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <small className="text-xs text-muted-foreground">
            User {review.user_id}
          </small>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <StarRating average={review.rating} total={1} compact />
            <small className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </small>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {review.comment || (
              <em className="text-muted-foreground">Tanpa komentar</em>
            )}
          </p>
        </div>

        {isOwner && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Aksi review"
              >
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onSelect={openEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={openDelete}>
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => !pending && setEditOpen(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit review</DialogTitle>
            <DialogDescription>
              Ubah rating dan komentar review kamu.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor={`review-rating-${review.id}`}>Rating</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  id={`review-rating-${review.id}`}
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
            <Label htmlFor={`review-comment-${review.id}`}>Komentar</Label>
            <Textarea
              id={`review-comment-${review.id}`}
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={pending === "edit"}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={pending === "edit"}>
              {pending === "edit" ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => !pending && setDeleteOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus review ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Review yang sudah dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{describeError(error)}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={pending === "delete"}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending === "delete"}
            >
              {pending === "delete" ? "Menghapus..." : "Hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
