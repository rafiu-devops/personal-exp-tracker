"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button, Card, Chip, FormField, Input, Textarea } from "@/components/ui";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/toast";
import { friendlyError } from "@/lib/errors";

export default function NewGroupPage() {
  const router = useRouter();
  const { people, addGroup } = useData();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) =>
    setMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  const save = async () => {
    if (!name.trim()) {
      toast("Enter a group name", "error");
      return;
    }
    setSaving(true);
    try {
      const id = await addGroup({ name: name.trim(), description, memberIds });
      toast("Group created", "success");
      router.push(`/groups/${id}`);
    } catch (error) {
      toast(friendlyError(error), "error");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="New group" back="/groups" />

      <Card className="space-y-4">
        <FormField label="Group name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Friends, Office Team, Karachi Trip"
            maxLength={60}
          />
        </FormField>
        <FormField label="Description (optional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group for?"
            maxLength={200}
          />
        </FormField>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground/70">Members</p>
          <Link href="/people" className="text-xs font-semibold text-brand">
            Manage people
          </Link>
        </div>
        {people.length === 0 ? (
          <p className="text-sm text-foreground/55">
            No people yet.{" "}
            <Link href="/people" className="font-semibold text-brand">
              Add friends
            </Link>{" "}
            first so you can add them to groups.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <Chip
                key={person.id}
                active={memberIds.includes(person.id)}
                onClick={() => toggle(person.id)}
              >
                {person.name}
              </Chip>
            ))}
          </div>
        )}
      </Card>

      <Button size="lg" fullWidth loading={saving} onClick={save}>
        Create group
      </Button>
    </div>
  );
}
