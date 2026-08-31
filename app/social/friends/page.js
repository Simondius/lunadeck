import { getPath } from "@/lib/data";
import FriendsScreen from "@/components/friends-screen";
import { demoFriends } from "@/lib/demo-friends";

export default async function FriendsPage() {
  const entries = await getPath();
  const totalNodes = entries
    .filter((e) => e.type === "section")
    .reduce((sum, e) => sum + e.nodeIds.length, 0);

  // Placeholder until there are accounts — see lib/demo-friends.js.
  return <FriendsScreen friends={demoFriends()} totalNodes={totalNodes} />;
}
