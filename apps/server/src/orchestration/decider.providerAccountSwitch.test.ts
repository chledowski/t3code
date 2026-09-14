import {
  CommandId,
  ProjectId,
  ProviderInstanceId,
  ThreadId,
  TurnId,
  type OrchestrationReadModel,
  type OrchestrationSession,
} from "@t3tools/contracts";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { expect, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import { decideOrchestrationCommand } from "./decider.ts";

const NOW = "2026-01-01T00:00:00.000Z";
const threadId = ThreadId.make("thread-1");
const claudeWork = ProviderInstanceId.make("claude_work");
const claudePersonal = ProviderInstanceId.make("claude_personal");

function makeReadModel(session: OrchestrationSession | null): OrchestrationReadModel {
  return {
    snapshotSequence: 0,
    projects: [],
    threads: [
      {
        id: threadId,
        projectId: ProjectId.make("project-1"),
        title: "Thread",
        modelSelection: { instanceId: claudeWork, model: "claude-model" },
        runtimeMode: "full-access",
        interactionMode: "default",
        branch: null,
        worktreePath: null,
        pullRequests: [],
        latestTurn: null,
        createdAt: NOW,
        updatedAt: NOW,
        archivedAt: null,
        settledOverride: null,
        settledAt: null,
        snoozedUntil: null,
        snoozedAt: null,
        pinnedAt: null,
        deletedAt: null,
        messages: [],
        proposedPlans: [],
        activities: [],
        checkpoints: [],
        session,
      },
    ],
    updatedAt: NOW,
  };
}

function makeSession(input: {
  readonly instanceId: ProviderInstanceId;
  readonly status: OrchestrationSession["status"];
  readonly activeTurnId?: TurnId;
}): OrchestrationSession {
  return {
    threadId,
    status: input.status,
    providerName: "claudeAgent",
    providerInstanceId: input.instanceId,
    runtimeMode: "full-access",
    activeTurnId: input.activeTurnId ?? null,
    lastError: null,
    updatedAt: NOW,
  };
}

const command = {
  type: "thread.provider-account.switch" as const,
  commandId: CommandId.make("cmd-switch"),
  threadId,
  fromInstanceId: claudeWork,
  modelSelection: { instanceId: claudePersonal, model: "claude-model" },
  createdAt: NOW,
};

it.layer(NodeServices.layer)("provider account switch decider", (it) => {
  it.effect("requests the switch for an idle thread on the named account", () =>
    Effect.gen(function* () {
      const result = yield* decideOrchestrationCommand({
        command,
        readModel: makeReadModel(makeSession({ instanceId: claudeWork, status: "ready" })),
      });
      const events = Array.isArray(result) ? result : [result];
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "thread.provider-account-switch-requested",
        payload: {
          threadId,
          fromInstanceId: claudeWork,
          modelSelection: command.modelSelection,
          createdAt: NOW,
        },
      });
    }),
  );

  it.effect("rejects a switch that names an account the thread has already left", () =>
    Effect.gen(function* () {
      const error = yield* decideOrchestrationCommand({
        command,
        readModel: makeReadModel(makeSession({ instanceId: claudePersonal, status: "ready" })),
      }).pipe(Effect.flip);
      expect(error._tag).toBe("OrchestrationCommandInvariantError");
      expect(error.message).toContain("Select the account again");
    }),
  );

  it.effect("rejects a switch while a turn is running", () =>
    Effect.gen(function* () {
      const error = yield* decideOrchestrationCommand({
        command,
        readModel: makeReadModel(
          makeSession({
            instanceId: claudeWork,
            status: "running",
            activeTurnId: TurnId.make("turn-1"),
          }),
        ),
      }).pipe(Effect.flip);
      expect(error._tag).toBe("OrchestrationCommandInvariantError");
      expect(error.message).toContain("still working");
    }),
  );
});
