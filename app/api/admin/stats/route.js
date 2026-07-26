import { NextResponse } from "next/server";
import { one, many } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { estimateCost } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Acces interzis." }, { status: 403 });

  const [
    totalUsersRow,
    totalConversationsRow,
    totalMessagesRow,
    activeUsersRow,
    activeSubsRow,
    totalTokensRow,
    pendingUpgradesRow,
    reported,
    errors,
    contacts,
    upgradeRequests,
    users,
    activity,
  ] = await Promise.all([
    one("SELECT COUNT(*) n FROM users"),
    one("SELECT COUNT(*) n FROM conversations"),
    one("SELECT COUNT(*) n FROM messages WHERE role='assistant'"),
    one(`SELECT COUNT(DISTINCT c.user_id) n FROM conversations c WHERE c.updated_at >= datetime('now','-7 days')`),
    one("SELECT COUNT(*) n FROM users WHERE plan='premium'"),
    one("SELECT COALESCE(SUM(tokens),0) n FROM messages"),
    one("SELECT COUNT(*) n FROM upgrade_requests WHERE status='pending'"),
    many(
      `SELECT m.id, m.content, m.created_at, u.email
       FROM messages m JOIN conversations c ON c.id=m.conversation_id
       JOIN users u ON u.id=c.user_id
       WHERE m.reported=1 ORDER BY m.id DESC LIMIT 50`
    ),
    many("SELECT * FROM errors ORDER BY id DESC LIMIT 50"),
    many("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 50"),
    many(
      `SELECT ur.id, ur.user_id, ur.email, ur.status, ur.created_at, u.plan
       FROM upgrade_requests ur JOIN users u ON u.id = ur.user_id
       WHERE ur.status = 'pending' ORDER BY ur.id DESC LIMIT 50`
    ),
    many(
      `SELECT id, email, name, provider, role, plan, blocked, created_at FROM users ORDER BY id DESC LIMIT 200`
    ),
    many(
      `SELECT substr(created_at,1,10) d, COUNT(*) c FROM messages
       WHERE created_at >= datetime('now','-14 days') GROUP BY d ORDER BY d`
    ),
  ]);

  const totalTokens = totalTokensRow.n;

  return NextResponse.json({
    stats: {
      totalUsers: totalUsersRow.n,
      totalConversations: totalConversationsRow.n,
      totalMessages: totalMessagesRow.n,
      activeUsers: activeUsersRow.n,
      activeSubs: activeSubsRow.n,
      totalTokens,
      estimatedCost: Number(estimateCost(totalTokens).toFixed(2)),
      pendingUpgrades: pendingUpgradesRow.n,
      reportedCount: reported.length,
      errorCount: errors.length,
    },
    activity,
    reported,
    errors,
    contacts,
    users,
    upgradeRequests,
  });
}
