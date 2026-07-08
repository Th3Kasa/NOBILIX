"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Pencil, Trash2, ShieldAlert } from "lucide-react";
import {
  updateUserAction,
  deleteUserAction,
  type ActionResult,
} from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";

interface Initial {
  displayName: string;
  country: string;
  character: string;
  currentLevel: number;
  highScore: number;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full">
      {pending ? "Deleting…" : "Permanently delete player"}
    </Button>
  );
}

export function UserActions({
  uid,
  canWrite,
  initial,
}: {
  uid: string;
  canWrite: boolean;
  initial: Initial;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  const [editState, editAction] = useActionState<ActionResult, FormData>(
    async (prev, fd) => {
      const res = await updateUserAction(prev, fd);
      if (res.ok) {
        setEditOpen(false);
        router.refresh();
      }
      return res;
    },
    {},
  );

  const [delState, delAction] = useActionState<ActionResult, FormData>(
    async (prev, fd) => {
      const res = await deleteUserAction(prev, fd);
      if (res.ok) {
        router.push("/console/trapman/users");
      }
      return res;
    },
    {},
  );

  if (!canWrite) {
    return (
      <Card className="console-glass">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your role is read-only. Editing and deletion are disabled.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="console-glass">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" /> Edit profile
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setDelOpen(true)}
          >
            <Trash2 className="size-4" /> Delete player
          </Button>
          <p className="pt-2 text-xs text-muted-foreground">
            Deletion is a compliant hard delete — it permanently removes the
            player&apos;s profile and sign-in account, and is recorded in the
            audit log.
          </p>
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        description="Correct a player's profile fields."
      >
        <form action={editAction} className="space-y-3">
          <input type="hidden" name="uid" value={uid} />
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" defaultValue={initial.displayName} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country (ISO)</Label>
              <Input
                id="country"
                name="country"
                maxLength={2}
                defaultValue={initial.country}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="character">Character</Label>
              <Input id="character" name="character" defaultValue={initial.character} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentLevel">Current level</Label>
              <Input
                id="currentLevel"
                name="currentLevel"
                type="number"
                defaultValue={initial.currentLevel}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="highScore">High score</Label>
              <Input
                id="highScore"
                type="number"
                value={initial.highScore}
                disabled
                aria-readonly="true"
              />
              <p className="text-xs text-muted-foreground">
                Read-only — set by gameplay, not editable here.
              </p>
            </div>
          </div>
          {editState.error && (
            <p className="text-sm text-destructive">{editState.error}</p>
          )}
          <SaveButton />
        </form>
      </Modal>

      {/* Delete modal */}
      <Modal
        open={delOpen}
        onClose={() => setDelOpen(false)}
        title="Delete player permanently"
      >
        <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            This cannot be undone. It permanently deletes the player&apos;s
            profile and sign-in account.
          </span>
        </div>
        <form action={delAction} className="space-y-3">
          <input type="hidden" name="uid" value={uid} />
          <div className="space-y-1.5">
            <Label htmlFor="confirm">
              Type the player ID to confirm:{" "}
              <span className="font-mono text-xs">{uid}</span>
            </Label>
            <Input id="confirm" name="confirm" placeholder={uid} autoComplete="off" />
          </div>
          {delState.error && (
            <p className="text-sm text-destructive">{delState.error}</p>
          )}
          <DeleteButton />
        </form>
      </Modal>
    </>
  );
}
