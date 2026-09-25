"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { getUser } from "@/lib/mock-data";
import { formatRelative } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export default function InvitationsPage() {
  const invitations = useAppStore((s) => s.invitations);
  const updateInvitation = useAppStore((s) => s.updateInvitation);

  const incoming = invitations.filter(
    (i) => i.type === "incoming" && i.status === "pending"
  );
  const requests = invitations.filter(
    (i) => i.type === "join_request" && i.status === "pending"
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-semibold">Invitations</h1>
        <p className="text-sm text-muted-foreground">
          Manage incoming invites and join requests for your projects.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Incoming Invitations</h2>
        {incoming.length === 0 ? (
          <EmptyState
            title="No pending invitations"
            description="When someone invites you to a project, it will show up here."
          />
        ) : (
          incoming.map((inv) => {
            const from = getUser(inv.fromUserId);
            return (
              <Card key={inv.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar name={from?.name || "User"} />
                    <div>
                      <p className="font-medium">
                        {from?.name} invited you to join &ldquo;{inv.projectName}&rdquo;
                      </p>
                      {inv.message && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {inv.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelative(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateInvitation(inv.id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateInvitation(inv.id, "declined")}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Join Requests</h2>
        {requests.length === 0 ? (
          <EmptyState
            title="No join requests"
            description="Requests to join projects you own will appear here."
          />
        ) : (
          requests.map((inv) => {
            const from = getUser(inv.fromUserId);
            return (
              <Card key={inv.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <Avatar name={from?.name || "User"} />
                    <div>
                      <p className="font-medium">
                        {from?.name} wants to join &ldquo;{inv.projectName}&rdquo;
                      </p>
                      {inv.message && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {inv.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelative(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateInvitation(inv.id, "accepted")}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateInvitation(inv.id, "declined")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
