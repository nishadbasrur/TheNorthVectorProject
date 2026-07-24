import "server-only";

// Every existing tool in lib/tool-dispatcher.ts executes autonomously —
// this is the first exception. run_agent_task can clone any repo the new
// GitHub PAT can reach and run Bash against it with permissionMode
// "bypassPermissions" (see agent-runner-service/src/server.ts), which is a
// meaningfully bigger blast radius than anything else North can do, so it
// requires the user to explicitly confirm out loud before it actually
// runs — see the `confirmed` gate in handleRunAgentTask.
const CONFIRM_TIER_TOOLS = new Set<string>(["run_agent_task"]);

export function requiresConfirmation(toolName: string): boolean {
  return CONFIRM_TIER_TOOLS.has(toolName);
}
